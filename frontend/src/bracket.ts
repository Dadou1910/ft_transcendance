import { v4 as uuidv4 } from "uuid";
import { StatsManager, Player, TournamentMatch } from "./stats";

// Defines the structure of a match in the tournament
interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner: string | null;
}

export class Bracket {
  private statsManager: StatsManager; // Manages game statistics
  private tournamentId: string; // Unique ID for the tournament
  private rounds: Match[][] = []; // Stores matches in each round
  private currentRound: number = 0; // Tracks the current round

  constructor(players: Player[], statsManager: StatsManager, tournamentId: string) {
    // Ensures exactly 4 players for the tournament
    if (players.length !== 4) {
      throw new Error("Bracket requires exactly 4 players");
    }
    this.statsManager = statsManager;
    this.tournamentId = tournamentId;
    this.generateInitialRound(players); // Sets up the first round
  }

  // Creates the first round by shuffling players and pairing them
  private generateInitialRound(players: Player[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5); // Randomizes player order
    const round: Match[] = [
      {
        id: uuidv4(), // Unique match ID
        player1: shuffled[0],
        player2: shuffled[1],
        winner: null, // No winner yet
      },
      {
        id: uuidv4(),
        player1: shuffled[2],
        player2: shuffled[3],
        winner: null,
      },
    ];
    this.rounds.push(round); // Adds matches to rounds
    // Records matches in stats manager
    round.forEach(match => {
      this.statsManager.addTournamentMatch(this.tournamentId, {
        id: match.id,
        tournamentId: this.tournamentId,
        roundNumber: 0,
        player1: match.player1,
        player2: match.player2,
        winner: null
      });
    });
  }

  // Sets up the next round after all matches in the current round are done
  private generateNextRound(): void {
    const previousRound = this.rounds[this.currentRound];
    // Checks if all matches have winners
    if (previousRound.every((match) => match.winner)) {
      // Gets winners from the previous round
      const winners = previousRound.map((match) => {
        const winnerId = match.winner!;
        return match.player1.id === winnerId ? match.player1 : match.player2;
      });
      // Creates final match if in the first round
      if (winners.length === 2 && this.currentRound === 0) {
        const newMatch: Match = {
          id: uuidv4(),
          player1: winners[0],
          player2: winners[1],
          winner: null,
        };
        this.rounds.push([newMatch]); // Adds final match
        // Records final match in stats
        this.statsManager.addTournamentMatch(this.tournamentId, {
          id: newMatch.id,
          tournamentId: this.tournamentId,
          roundNumber: 1,
          player1: newMatch.player1,
          player2: newMatch.player2,
          winner: null
        });
        this.currentRound++; // Moves to final round
      }
    }
  }

  // Finds the next unplayed match or generates a new round
  getNextMatch(): Match | null {
    const currentRoundMatches = this.rounds[this.currentRound];
    if (currentRoundMatches) {
      const unplayedMatch = currentRoundMatches.find((match) => !match.winner);
      if (unplayedMatch) {
        return unplayedMatch; // Returns unplayed match
      }
    }
    this.generateNextRound(); // Creates next round if needed
    return this.rounds[this.currentRound]?.find((match) => !match.winner) || null;
  }

  // Sets the winner of a specific match
  setMatchWinner(matchId: string, winnerId: string): void {
    for (const round of this.rounds) {
      const match = round.find((m) => m.id === matchId);
      if (match) {
        // Validates winner is one of the players
        if (match.player1.id !== winnerId && match.player2.id !== winnerId) {
          throw new Error("Winner ID does not match either player");
        }
        match.winner = winnerId; // Sets winner
        // Updates stats with the winner
        this.statsManager.setTournamentMatchWinner(this.tournamentId, matchId, winnerId);
        return;
      }
    }
    throw new Error("Match not found");
  }

  // Retrieves a match by its ID
  getMatch(matchId: string): Match | null {
    for (const round of this.rounds) {
      const match = round.find((m) => m.id === matchId);
      if (match) {
        return match;
      }
    }
    return null;
  }

  // Checks if the tournament is finished
  isComplete(): boolean {
    return (
      this.currentRound === this.rounds.length - 1 &&
      this.rounds[this.currentRound]?.every((match) => match.winner)
    );
  }

  // Gets the tournament winner
  getWinner(): string | null {
    if (!this.isComplete()) {
      return null; // No winner if not complete
    }
    return this.rounds[this.rounds.length - 1][0].winner; // Returns final match winner
  }

  // Returns all rounds
  getRounds(): Match[][] {
    return this.rounds;
  }

  // Returns the current round number
  getCurrentRound(): number {
    return this.currentRound;
  }
}
