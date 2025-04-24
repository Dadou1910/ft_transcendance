const uuidv4 = () => crypto.randomUUID();

// Defines structure for a match record
export interface MatchRecord {
  winner: string;
  loser: string;
  timestamp: string;
}

// Defines structure for player statistics
export interface PlayerStats {
  wins: number;
  losses: number;
  tournamentsWon: number;
}

// Defines structure for a user
export interface User {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

// Defines structure for a player
export interface Player {
  id: string;
  name: string;
}

// Defines structure for a tournament match
export interface TournamentMatch {
  id: string;
  tournamentId: string;
  roundNumber: number;
  player1: Player;
  player2: Player;
  winner: string | null;
}

// Defines structure for user settings
export interface UserSettings {
  backgroundColor?: string;
  ballSpeed?: number;
}

// Defines structure for game-specific statistics
export interface GameStats {
  username: string;
  gameType: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
}

// Manages game statistics, user data, and tournament information
export class StatsManager {
  private matchHistory: MatchRecord[] = [];
  private playerStats: Record<string, PlayerStats> = {};
  private users: User[] = [];
  private currentUserEmail: string | null = null;
  private tournamentPlayers: Record<string, Player[]> = {};
  private tournamentMatches: Record<string, TournamentMatch[]> = {};
  private userSettings: Record<string, UserSettings> = {};
  private gameStats: Record<string, Record<string, GameStats>> = {};

  constructor() {
    this.currentUserEmail = localStorage.getItem("currentUserEmail") || null;
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      if (this.currentUserEmail) {
        console.log(`Attempting to fetch user profile for email: ${this.currentUserEmail}`);
        const response = await fetch(`http://localhost:4000/auth/user-by-email?email=${encodeURIComponent(this.currentUserEmail)}`);
        if (response.ok) {
          const { user, matches, settings } = await response.json();
          console.log(`Fetched user data:`, user);
          this.users = this.users.filter(u => u.email !== this.currentUserEmail);
          this.users.push({
            username: user.name,
            email: user.email,
            password: "",
            avatarUrl: user.avatarUrl,
          });
          this.matchHistory = matches.map((m: any) => ({
            winner: m.userScore > m.opponentScore ? user.name : m.opponentId,
            loser: m.userScore > m.opponentScore ? m.opponentId : user.name,
            timestamp: m.date,
          }));
          this.playerStats[user.name] = {
            wins: user.wins,
            losses: user.losses,
            tournamentsWon: user.tournamentsWon,
          };
          if (settings) {
            this.userSettings[user.email] = {
              backgroundColor: settings.backgroundColor,
              ballSpeed: settings.ballSpeed,
            };
          }
        } else {
          console.warn(`Failed to fetch profile for ${this.currentUserEmail}. Status: ${response.status}`);
          localStorage.removeItem("currentUserEmail");
          this.currentUserEmail = null;
        }
      }
      console.log("Initialized StatsManager with backend data");
    } catch (error) {
      console.error("Error loading initial data from backend:", error);
    }
  }

  // --- User Management ---
  addUser(username: string, email: string, password: string, avatar?: File): void {
    let avatarUrl: string | undefined;
    if (avatar) {
      try {
        avatarUrl = URL.createObjectURL(avatar);
      } catch (error) {
        console.error("Failed to create avatar URL:", error);
      }
    }
    const user = { username, email: email.toLowerCase(), password, avatarUrl };
    this.users.push(user);
    console.log("Added user:", { username, email, avatarUrl });
  }

  hasUser(username: string): boolean {
    const exists = this.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    console.log("Checking if user exists:", { username, exists });
    return exists;
  }

  getUserByEmail(email: string): User | undefined {
    const user = this.users.find((user) => user.email === email.toLowerCase());
    console.log("getUserByEmail:", { email, found: !!user });
    return user;
  }

  setCurrentUser(email: string): void {
    console.log("Setting current user to:", email);
    this.currentUserEmail = email.toLowerCase();
    localStorage.setItem("currentUserEmail", this.currentUserEmail);
  }

  getCurrentUser(): User | null {
    if (!this.currentUserEmail) {
      console.log("No current user set");
      return null;
    }
    const user = this.getUserByEmail(this.currentUserEmail);
    console.log("getCurrentUser:", user ? user.email : "none");
    return user || null;
  }

  logout(): void {
    console.log("Logging out, clearing current user");
    this.currentUserEmail = null;
    localStorage.removeItem("currentUserEmail");
  }

  // --- Tournament Management ---
  addTournamentPlayers(tournamentId: string, players: Player[]): void {
    this.tournamentPlayers[tournamentId] = players;
    console.log("Added tournament players:", { tournamentId, players });
  }

  getTournamentPlayers(tournamentId: string): Player[] {
    return this.tournamentPlayers[tournamentId] || [];
  }

  clearTournamentPlayers(tournamentId: string): void {
    delete this.tournamentPlayers[tournamentId];
    console.log("Cleared tournament players:", { tournamentId });
  }

  addTournamentMatch(tournamentId: string, match: TournamentMatch): void {
    if (!this.tournamentMatches[tournamentId]) {
      this.tournamentMatches[tournamentId] = [];
    }
    this.tournamentMatches[tournamentId].push(match);
    console.log("Added tournament match:", { tournamentId, match });
  }

  setTournamentMatchWinner(tournamentId: string, matchId: string, winnerId: string): void {
    const matches = this.tournamentMatches[tournamentId];
    if (matches) {
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        if (match.player1.id !== winnerId && match.player2.id !== winnerId) {
          throw new Error("Winner ID does not match either player");
        }
        match.winner = winnerId;
        console.log("Set match winner:", { tournamentId, matchId, winnerId });
      } else {
        throw new Error("Match not found");
      }
    } else {
      throw new Error("Tournament not found");
    }
  }

  getTournamentMatches(tournamentId: string): TournamentMatch[] {
    return this.tournamentMatches[tournamentId] || [];
  }

  // --- Match and Stats Management ---
  async recordMatch(winner: string, loser: string, gameType: string, matchDetails?: { player1Score: number; player2Score: number }): Promise<void> {
    const match: MatchRecord = {
      winner,
      loser,
      timestamp: new Date().toISOString(),
    };
    this.matchHistory.push(match);
  
    if (!this.playerStats[winner]) {
      this.playerStats[winner] = { wins: 0, losses: 0, tournamentsWon: 0 };
    }
    if (!this.playerStats[loser]) {
      this.playerStats[loser] = { wins: 0, losses: 0, tournamentsWon: 0 };
    }
  
    this.playerStats[winner].wins += 1;
    this.playerStats[loser].losses += 1;
  
    console.log("Recorded match locally:", { winner, loser, matchDetails });
  
    try {
      let player1User: any = null;
      let player2User: any = null;
      let player1Name: string | null = null;
      let player2Name: string | null = null;
  
      const currentUser = await this.getCurrentUser();
  
      // Determine Player 1 (match initiator) and Player 2 (opponent)
      // In game.ts, Player 1 is the left player (e.g., "dadou"), Player 2 is the right player (e.g., "Player 2")
      if (winner === "Player 1" || loser === "Player 1") {
        // Player 1 is explicitly mentioned
        player1Name = "Player 1";
        player2Name = winner === "Player 1" ? loser : winner;
      } else if (currentUser && (winner === currentUser.username || loser === currentUser.username)) {
        // Player names are usernames, and one matches the logged-in user (assume Player 1 is the logged-in user)
        player1Name = currentUser.username;
        player2Name = winner === currentUser.username ? loser : winner;
      } else {
        // Fallback: Assume loser is Player 1 if winner is "Player 2", or winner is Player 1 if loser is "Player 2"
        // This aligns with game.ts: recordMatch(playerRightName, playerLeftName) if Player 2 wins
        if (winner === "Player 2") {
          player1Name = loser; // e.g., "dadou"
          player2Name = winner; // "Player 2"
        } else if (loser === "Player 2") {
          player1Name = winner; // e.g., "dadou"
          player2Name = loser; // "Player 2"
        } else {
          // Neither player is "Player 1" or "Player 2", default to winner as Player 1
          player1Name = winner;
          player2Name = loser;
        }
      }
  
      // Replace "Player 1" with the logged-in user's username if available
      if (player1Name === "Player 1" && currentUser) {
        player1Name = currentUser.username;
      }
  
      // Fetch user data for Player 1 (if it's a registered username)
      if (player1Name && player1Name !== "Player 1" && player1Name !== "Player 2") {
        const player1Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(player1Name)}`);
        if (player1Response.ok) {
          player1User = (await player1Response.json()).user;
        }
      }
  
      // Fetch user data for Player 2 (if it's a registered username)
      if (player2Name && player2Name !== "Player 1" && player2Name !== "Player 2") {
        const player2Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(player2Name)}`);
        if (player2Response.ok) {
          player2User = (await player2Response.json()).user;
        }
      }
  
      const userId = player1User?.id || null; // Player 1 (match initiator, e.g., dadou)
      const opponentId = player2User?.id || null; // Player 2 (opponent, e.g., Player 2)
      const userName = player1Name;
      const opponentName = player2Name;
  
      // Assign scores based on fixed roles: user is Player 1, opponent is Player 2
      const userScore = matchDetails?.player1Score || 0; // Player 1's score (e.g., dadou)
      const opponentScore = matchDetails?.player2Score || 0; // Player 2's score (e.g., Player 2)
  
      console.log("Sending to /match:", {
        userId,
        opponentId,
        userName,
        opponentName,
        userScore,
        opponentScore,
        gameType,
      });
  
      const matchResponse = await fetch("http://localhost:4000/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          opponentId,
          userName,
          opponentName,
          userScore,
          opponentScore,
          gameType,
        }),
      });
  
      const responseData = await matchResponse.json();
      console.log("Match response:", { status: matchResponse.status, data: responseData });
  
      if (!matchResponse.ok) {
        throw new Error(responseData.error || "Failed to record match");
      }
  
      console.log("Match recorded in backend:", { userId, opponentId, userName, opponentName, userScore, opponentScore, gameType });
    } catch (error) {
      console.error("Error recording match in backend:", error);
      alert("Failed to record match: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  recordGameStats(username: string, gameType: string, isWinner: boolean): void {
    if (!this.gameStats[username]) {
      this.gameStats[username] = {};
    }
    if (!this.gameStats[username][gameType]) {
      this.gameStats[username][gameType] = {
        username,
        gameType,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      };
    }

    const stats = this.gameStats[username][gameType];
    stats.gamesPlayed += 1;
    if (isWinner) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }

    console.log("Recorded game stats:", { username, gameType, isWinner, stats });
  }

  getGameStats(username: string, gameType: string): GameStats | null {
    return this.gameStats[username]?.[gameType] || null;
  }

  recordTournamentWin(player: string): void {
    if (!this.playerStats[player]) {
      this.playerStats[player] = { wins: 0, losses: 0, tournamentsWon: 0 };
    }
    this.playerStats[player].tournamentsWon += 1;
    console.log("Recorded tournament win:", { player });
  }

  getMatchHistory(): MatchRecord[] {
    return this.matchHistory;
  }

  getPlayerStats(player: string): PlayerStats | null {
    return this.playerStats[player] || null;
  }

  // --- User Settings Management ---
  async setUserSettings(email: string, settings: Partial<UserSettings>): Promise<void> {
    if (!this.userSettings[email]) {
      this.userSettings[email] = {};
    }
    this.userSettings[email] = { ...this.userSettings[email], ...settings };
    console.log("Set user settings locally:", { email, settings });

    try {
      // Find the user by email to get the username
      const user = this.getUserByEmail(email);
      if (!user) {
        throw new Error("User not found locally");
      }

      // Fetch user ID by username using /profile/:id
      const userResponse = await fetch(`http://localhost:4000/profile/${encodeURIComponent(user.username)}`);
      if (!userResponse.ok) {
        throw new Error("User not found in backend");
      }
      const { user: backendUser } = await userResponse.json();

      // Send settings to backend
      const settingsResponse = await fetch("http://localhost:4000/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: backendUser.id,
          backgroundColor: settings.backgroundColor,
          ballSpeed: settings.ballSpeed,
        }),
      });

      if (!settingsResponse.ok) {
        const data = await settingsResponse.json();
        throw new Error(data.error || "Failed to save settings");
      }

      console.log("Settings saved to backend:", { userId: backendUser.id, settings });
    } catch (error) {
      console.error("Error saving settings to backend:", error);
    }
  }

  getUserSettings(email: string): UserSettings | null {
    return this.userSettings[email] || null;
  }
}

