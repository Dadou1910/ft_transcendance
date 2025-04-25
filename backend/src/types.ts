import { SocketStream } from "@fastify/websocket"; // Import SocketStream for Fastify WebSocket connections

export interface User {
    id?: number
    name: string
    email: string
    password: string
    wins: number
    losses: number
    tournamentsWon: number
}

export interface UserSettings {
    userId: number
    backgroundColor?: string
    ballSpeed?: number
}

export interface Match {
    id?: number;
    userId?: number; // Now nullable
    opponentId?: number; // Now nullable
    userName: string; // New field
    opponentName: string; // New field
    userScore: number;
    opponentScore: number;
    gameType: string; // New field
    date: string;
}

export interface Tournament {
    id?: number
    createdAt: string
}

export interface TournamentPlayer {
    tournamentId: number
    username: string
    position?: number // Added to store 1st to 4th place (1 = 1st, 2 = 2nd, etc.)
}

export interface TournamentMatch {
    id?: number
    tournamentId: number
    roundNumber: number
    player1: string
    player2: string
    winner?: string
}

export interface GameSession {
    player1: { socket: SocketStream; playerId: string }
    player2: { socket: SocketStream; playerId: string }
}

export interface WebSocketClient {
    socket: SocketStream;
    playerId?: string;
    gameSession?: GameSession;
}