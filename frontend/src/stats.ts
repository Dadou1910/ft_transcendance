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

// Manages game statistics, user data, and tournament information
export class StatsManager {
  // Stores match history
  private matchHistory: MatchRecord[] = [];
  // Stores player statistics
  private playerStats: Record<string, PlayerStats> = {};
  // Stores user accounts
  private users: User[] = [];
  // Tracks current logged-in user
  private currentUserEmail: string | null = null;
  // Maps tournament IDs to players
  private tournamentPlayers: Record<string, Player[]> = {};
  // Maps tournament IDs to matches
  private tournamentMatches: Record<string, TournamentMatch[]> = {};
  // Stores user settings by email
  private userSettings: Record<string, UserSettings> = {};

  // Initializes the stats manager
  constructor() {
    // Note: For database integration, initialize by loading data from tables
    this.currentUserEmail = localStorage.getItem("currentUserEmail") || null;
  }

  // --- User Management ---
  // Adds a new user to the system
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

  // Checks if a user exists by username
  hasUser(username: string): boolean {
    const exists = this.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    console.log("Checking if user exists:", { username, exists });
    return exists;
  }

  // Retrieves a user by email
  getUserByEmail(email: string): User | undefined {
    const user = this.users.find((user) => user.email === email.toLowerCase());
    console.log("getUserByEmail:", { email, found: !!user });
    return user;
  }

  // Sets the current user
  setCurrentUser(email: string): void {
    console.log("Setting current user to:", email);
    this.currentUserEmail = email.toLowerCase();
    localStorage.setItem("currentUserEmail", this.currentUserEmail);
  }

  // Gets the current user
  getCurrentUser(): User | null {
    if (!this.currentUserEmail) {
      console.log("No current user set");
      return null;
    }
    const user = this.getUserByEmail(this.currentUserEmail);
    console.log("getCurrentUser:", user ? user.email : "none");
    return user || null;
  }

  // Logs out the current user
  logout(): void {
    console.log("Logging out, clearing current user");
    this.currentUserEmail = null;
    localStorage.removeItem("currentUserEmail");
  }

  // --- Tournament Management ---
  // Adds players to a tournament
  addTournamentPlayers(tournamentId: string, players: Player[]): void {
    this.tournamentPlayers[tournamentId] = players;
    console.log("Added tournament players:", { tournamentId, players });
  }

  // Retrieves players for a tournament
  getTournamentPlayers(tournamentId: string): Player[] {
    return this.tournamentPlayers[tournamentId] || [];
  }

  // Clears players from a tournament
  clearTournamentPlayers(tournamentId: string): void {
    delete this.tournamentPlayers[tournamentId];
    console.log("Cleared tournament players:", { tournamentId });
  }

  // Adds a match to a tournament
  addTournamentMatch(tournamentId: string, match: TournamentMatch): void {
    if (!this.tournamentMatches[tournamentId]) {
      this.tournamentMatches[tournamentId] = [];
    }
    this.tournamentMatches[tournamentId].push(match);
    console.log("Added tournament match:", { tournamentId, match });
  }

  // Sets the winner of a tournament match
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

  // Retrieves matches for a tournament
  getTournamentMatches(tournamentId: string): TournamentMatch[] {
    return this.tournamentMatches[tournamentId] || [];
  }

  // --- Match and Stats Management ---
  // Records a match result
  recordMatch(winner: string, loser: string, matchDetails?: { player1Score: number; player2Score: number }): void {
    const match: MatchRecord = {
      winner,
      loser,
      timestamp: new Date().toISOString(),
    };
    this.matchHistory.push(match);

    // Initialize player stats if not present
    if (!this.playerStats[winner]) {
      this.playerStats[winner] = { wins: 0, losses: 0, tournamentsWon: 0 };
    }
    if (!this.playerStats[loser]) {
      this.playerStats[loser] = { wins: 0, losses: 0, tournamentsWon: 0 };
    }

    this.playerStats[winner].wins += 1;
    this.playerStats[loser].losses += 1;

    console.log("Recorded match:", { winner, loser, matchDetails });
  }

  // Records a tournament win for a player
  recordTournamentWin(player: string): void {
    if (!this.playerStats[player]) {
      this.playerStats[player] = { wins: 0, losses: 0, tournamentsWon: 0 };
    }
    this.playerStats[player].tournamentsWon += 1;
    console.log("Recorded tournament win:", { player });
  }

  // Retrieves the match history
  getMatchHistory(): MatchRecord[] {
    return this.matchHistory;
  }

  // Retrieves statistics for a player
  getPlayerStats(player: string): PlayerStats | null {
    return this.playerStats[player] || null;
  }

  // --- User Settings Management ---
  // Sets user settings for a given email
  setUserSettings(email: string, settings: Partial<UserSettings>): void {
    if (!this.userSettings[email]) {
      this.userSettings[email] = {};
    }
    this.userSettings[email] = { ...this.userSettings[email], ...settings };
    console.log("Set user settings:", { email, settings });
  }

  // Retrieves user settings for a given email
  getUserSettings(email: string): UserSettings | null {
    return this.userSettings[email] || null;
  }
}