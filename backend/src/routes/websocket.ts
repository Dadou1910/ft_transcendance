import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { WebSocketClient, GameSession } from '../types';

export async function websocketRoutes(fastify: FastifyInstance) {
  // Store waiting player and active games
  let waitingPlayer: WebSocketClient | null = null;
  const activeGames: Map<string, GameSession> = new Map();

  fastify.get('/game', { websocket: true }, (connection: SocketStream, req) => {
    fastify.log.info('WebSocket client connected');

    const client: WebSocketClient = { socket: connection };

    connection.on('message', (message: Buffer | string) => {
      const messageStr = message.toString();
      fastify.log.info(`Received WebSocket message: ${messageStr}`);

      let data: any;
      try {
        data = JSON.parse(messageStr);
      } catch (error) {
        fastify.log.error('Failed to parse WebSocket message:', error);
        return;
      }

      fastify.log.info(`Parsed message data: ${JSON.stringify(data)}`);

      if (data.type === "join") {
        fastify.log.info(`Join message received from player: ${data.playerId}`);
        client.playerId = data.playerId;

        if (waitingPlayer) {
          fastify.log.info(`Pairing player ${waitingPlayer.playerId} with player ${client.playerId}`);
          // Pair the players
          const gameId = `${waitingPlayer.playerId}-${client.playerId}`;
          const gameSession: GameSession = {
            player1: { socket: waitingPlayer.socket, playerId: waitingPlayer.playerId! },
            player2: { socket: client.socket, playerId: client.playerId! }
          };
          activeGames.set(gameId, gameSession);

          // Assign game session to both clients
          waitingPlayer.gameSession = gameSession;
          client.gameSession = gameSession;

          // Notify player 1
          fastify.log.info(`Sending paired message to player1 (${waitingPlayer.playerId})`);
          waitingPlayer.socket.socket.send(
            JSON.stringify({
              type: "paired",
              role: "player1",
              opponentId: client.playerId,
            })
          );

          // Notify player 2
          fastify.log.info(`Sending paired message to player2 (${client.playerId})`);
          client.socket.socket.send(
            JSON.stringify({
              type: "paired",
              role: "player2",
              opponentId: waitingPlayer.playerId,
            })
          );

          waitingPlayer = null;
          fastify.log.info('Players paired, waitingPlayer reset to null');
        } else {
          waitingPlayer = client;
          fastify.log.info(`Player ${client.playerId} set as waitingPlayer`);
        }
      } else if (data.type === "paddleMove" && client.playerId && client.gameSession) {
        fastify.log.info(`Relaying paddleMove from ${client.playerId}`);
        // Relay paddle movement to the opponent
        const opponentSocket = client.gameSession.player1.playerId === client.playerId
          ? client.gameSession.player2.socket
          : client.gameSession.player1.socket;

        opponentSocket.socket.send(
          JSON.stringify({
            type: "paddleMove",
            position: data.position,
            playerId: data.playerId,
          })
        );
      } else if (data.type === "gameState" && client.playerId && client.gameSession) {
        // Relay game state from player1 to player2
        if (client.gameSession.player1.playerId === client.playerId) {
          fastify.log.info(`Relaying gameState from player1 (${client.playerId}) to player2`);
          client.gameSession.player2.socket.socket.send(JSON.stringify(data));
        }
      } else if (data.type === "gameStart" && client.playerId && client.gameSession) {
        // Relay game start signal from player1 to player2
        if (client.gameSession.player1.playerId === client.playerId) {
          fastify.log.info(`Relaying gameStart from player1 (${client.playerId}) to player2`);
          client.gameSession.player2.socket.socket.send(JSON.stringify({ type: "gameStart" }));
        }
      } else if (data.type === "pause" && client.playerId && client.gameSession) {
        // Relay pause signal from player1 to player2
        if (client.gameSession.player1.playerId === client.playerId) {
          fastify.log.info(`Relaying pause from player1 (${client.playerId}) to player2`);
          client.gameSession.player2.socket.socket.send(JSON.stringify({ type: "pause", isPaused: data.isPaused }));
        }
      }
    });

    connection.on('close', () => {
      fastify.log.info('WebSocket client disconnected');

      // Handle disconnection
      if (waitingPlayer?.socket === client.socket) {
        waitingPlayer = null;
        fastify.log.info('Disconnected client was waitingPlayer, reset to null');
      } else if (client.gameSession) {
        const opponentSocket = client.gameSession.player1.socket === client.socket
          ? client.gameSession.player2.socket
          : client.gameSession.player1.socket;

        fastify.log.info(`Notifying opponent of disconnection`);
        opponentSocket.socket.send(JSON.stringify({ type: "opponentDisconnected" }));

        // Remove the game session
        for (const [gameId, session] of activeGames.entries()) {
          if (session === client.gameSession) {
            activeGames.delete(gameId);
            fastify.log.info(`Game session ${gameId} removed due to disconnection`);
            break;
          }
        }
      }
    });

    connection.on('error', (err: Error) => {
      fastify.log.error('WebSocket error:', err);
    });
  });
}