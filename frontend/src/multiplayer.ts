import { StatsManager } from "./stats.js";

// Multiplayer Pong Game class (WebSocket-based)
export class MultiplayerPongGame {
  // Canvas and context for rendering
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  // UI elements for game settings and scores
  public speedSlider: HTMLInputElement;
  public backgroundColorSelect: HTMLSelectElement | null;
  public scoreLeftElement: HTMLSpanElement;
  public scoreRightElement: HTMLSpanElement;
  public restartButton: HTMLButtonElement;
  public settingsButton: HTMLButtonElement;
  public settingsMenu: HTMLDivElement;
  public settingsContainer: HTMLDivElement;
  public statsManager: StatsManager;
  public userName: string | null;
  public navigate: (path: string) => void;

  // Multiplayer state
  public ws: WebSocket | null = null;
  public isHost: boolean = false;
  public opponentName: string = "";
  public localPlayerReady: boolean = false;
  public remotePlayerReady: boolean = false;

  // Game state variables (replicate from PongGame)
  public paddleLeftY: number = 160;
  public paddleRightY: number = 160;
  public ballX: number = 400;
  public ballY: number = 200;
  public ballSpeedX: number = 6.0;
  public ballSpeedY: number = 4.1;
  public scoreLeft: number = 0;
  public scoreRight: number = 0;
  public gameOver: boolean = false;
  public gameStarted: boolean = false;
  public isPaused: boolean = false;
  public playerLeftName: string;
  public playerRightName: string;
  public backgroundColor: string = "#d8a8b5";
  public onGameEnd?: (winnerName: string) => void;
  public hasTriggeredGameEnd: boolean = false;
  public paddleSpeed: number = 5;
  public keys: Record<"w" | "s" | "ArrowUp" | "ArrowDown", boolean> = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false,
  };
  public baseBallSpeedX: number = 6.0;
  public baseBallSpeedY: number = 4.1;
  public baseWidth: number = 800;
  public baseHeight: number = 400;
  public scale: number = 1;
  public lastTime: number = 0;
  public gameLoopRunning: boolean = false;

  constructor(
    playerLeftName: string,
    playerRightName: string,
    canvasId: string,
    speedSliderId: string,
    backgroundColorSelectId: string,
    scoreLeftId: string,
    scoreRightId: string,
    restartButtonId: string,
    settingsButtonId: string,
    settingsMenuId: string,
    settingsContainerId: string,
    statsManager: StatsManager,
    userName: string | null,
    onGameEnd?: (winnerName: string) => void,
    navigate?: (path: string) => void
  ) {
    this.playerLeftName = playerLeftName;
    this.playerRightName = playerRightName;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.speedSlider = document.getElementById(speedSliderId) as HTMLInputElement;
    this.backgroundColorSelect = document.getElementById(backgroundColorSelectId) as HTMLSelectElement | null;
    this.scoreLeftElement = document.getElementById(scoreLeftId) as HTMLSpanElement;
    this.scoreRightElement = document.getElementById(scoreRightId) as HTMLSpanElement;
    this.restartButton = document.getElementById(restartButtonId) as HTMLButtonElement;
    this.settingsButton = document.getElementById(settingsButtonId) as HTMLButtonElement;
    this.settingsMenu = document.getElementById(settingsMenuId) as HTMLDivElement;
    this.settingsContainer = document.getElementById(settingsContainerId) as HTMLDivElement;
    this.statsManager = statsManager;
    this.userName = userName;
    this.onGameEnd = onGameEnd;
    this.navigate = navigate || (() => {});
    // Set initial ball speed using base values and speed multiplier
    const speedMultiplier = this.getSpeedMultiplier();
    this.ballSpeedX = this.baseBallSpeedX * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = this.baseBallSpeedY * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    // Ensure Back button is always visible
    const backButton = document.getElementById("backButton") as HTMLButtonElement;
    if (backButton) backButton.style.display = "block";
    // Multiplayer-specific setup (WebSocket, etc.) will be added here
  }

  // Placeholder for multiplayer-specific setup
  public setupWebSocket(ws: WebSocket, isHost: boolean, opponentName: string) {
    this.ws = ws;
    this.isHost = isHost;
    this.opponentName = opponentName;
    // No ws.onmessage assignment here! All message handling is done in index.ts
    // Paddle input listeners (both host and guest)
    document.addEventListener("keydown", (e) => {
      if (["w", "s", "ArrowUp", "ArrowDown"].includes(e.key)) {
        if (!this.isHost && this.ws) {
          this.ws.send(JSON.stringify({ type: "paddle", key: e.key, pressed: true }));
        } else {
          this.keys[e.key as keyof typeof this.keys] = true;
        }
      }
    });
    document.addEventListener("keyup", (e) => {
      if (["w", "s", "ArrowUp", "ArrowDown"].includes(e.key)) {
        if (!this.isHost && this.ws) {
          this.ws.send(JSON.stringify({ type: "paddle", key: e.key, pressed: false }));
        } else {
          this.keys[e.key as keyof typeof this.keys] = false;
        }
      }
    });
  }

  // Host: handle paddle input from guest
  public handlePaddleMessage(msg: any) {
    if (this.isHost && msg.type === "paddle" && msg.key in this.keys) {
      this.keys[msg.key as keyof typeof this.keys] = msg.pressed;
    }
  }

  // Guest: handle state updates from host
  public handleStateMessage(msg: any) {
    if (!this.isHost && msg.type === "state") {
      Object.assign(this, msg.state);
      this.draw(performance.now());
    }
  }

  // Call this after assignment to ensure the game loop starts when gameStarted is set to true
  public pollForGameStart() {
    const poll = () => {
      if (this.gameStarted && !this.gameLoopRunning) {
        this.startGameLoop();
        this.gameLoopRunning = true;
        console.log('[DEBUG] Poll: gameStarted detected, game loop started');
      } else {
        requestAnimationFrame(poll);
      }
    };
    requestAnimationFrame(poll);
  }

  // Host: runs the game loop and sends state to guest
  public startGameLoop() {
    this.gameLoopRunning = true;
    const loop = (timestamp: number) => {
      if (!this.gameStarted || this.gameOver) {
        this.gameLoopRunning = false;
        return;
      }
      this.updateGameState(timestamp);
      this.draw(timestamp);
      // Send state to guest
      if (this.ws && this.isHost) {
        this.ws.send(JSON.stringify({
          type: "state",
          state: {
            paddleLeftY: this.paddleLeftY,
            paddleRightY: this.paddleRightY,
            ballX: this.ballX,
            ballY: this.ballY,
            ballSpeedX: this.ballSpeedX,
            ballSpeedY: this.ballSpeedY,
            scoreLeft: this.scoreLeft,
            scoreRight: this.scoreRight,
            gameOver: this.gameOver,
            gameStarted: this.gameStarted,
          }
        }));
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Host: updates the game state
  private updateGameState(timestamp: number) {
    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (this.isPaused || this.gameOver) return;
    // Paddle movement
    if (this.keys.w && this.paddleLeftY > 0) this.paddleLeftY -= this.paddleSpeed;
    if (this.keys.s && this.paddleLeftY < this.baseHeight - 80) this.paddleLeftY += this.paddleSpeed;
    if (this.keys.ArrowUp && this.paddleRightY > 0) this.paddleRightY -= this.paddleSpeed;
    if (this.keys.ArrowDown && this.paddleRightY < this.baseHeight - 80) this.paddleRightY += this.paddleSpeed;
    // Ball movement
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;
    // Collisions
    if (this.ballY <= 0 || this.ballY >= this.baseHeight) this.ballSpeedY = -this.ballSpeedY;
    // Paddle collisions
    if (
      this.ballX - 10 <= 30 &&
      this.ballX + 10 >= 10 &&
      this.ballY >= this.paddleLeftY &&
      this.ballY <= this.paddleLeftY + 80
    ) {
      this.ballSpeedX = -this.ballSpeedX;
      this.ballX = 30 + 10;
    }
    if (
      this.ballX + 10 >= this.baseWidth - 30 &&
      this.ballX - 10 <= this.baseWidth - 10 &&
      this.ballY >= this.paddleRightY &&
      this.ballY <= this.paddleRightY + 80
    ) {
      this.ballSpeedX = -this.ballSpeedX;
      this.ballX = this.baseWidth - 30 - 10;
    }
    // Scoring
    if (this.ballX < 0) {
      this.scoreRight++;
      this.resetBall();
    } else if (this.ballX > this.baseWidth) {
      this.scoreLeft++;
      this.resetBall();
    }
    // Game over
    if (this.scoreLeft >= 3 || this.scoreRight >= 3) {
      this.gameOver = true;
      if (!this.hasTriggeredGameEnd) {
        this.hasTriggeredGameEnd = true;
        const winnerName = this.scoreLeft >= 3 ? this.playerLeftName : this.playerRightName;
        const loserName = this.scoreLeft >= 3 ? this.playerRightName : this.playerLeftName;
        const winnerScore = this.scoreLeft >= 3 ? this.scoreLeft : this.scoreRight;
        const loserScore = this.scoreLeft >= 3 ? this.scoreRight : this.scoreLeft;
        
        this.recordMatch(winnerName, loserName, winnerScore, loserScore);
        
        if (this.onGameEnd) {
          this.onGameEnd(winnerName);
        }
      }
    }
  }

  private resetBall() {
    this.ballX = this.baseWidth / 2;
    this.ballY = this.baseHeight / 2;
    const speedMultiplier = this.getSpeedMultiplier();
    this.ballSpeedX = this.baseBallSpeedX * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = this.baseBallSpeedY * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
  }

  // Both: renders the game using the current state
  public draw(timestamp: number = performance.now()) {
    // Clear canvas
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
    // Draw paddles
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(10, this.paddleLeftY, 20, 80);
    this.ctx.fillRect(this.baseWidth - 30, this.paddleRightY, 20, 80);
    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    // Draw scores
    this.scoreLeftElement.textContent = this.scoreLeft.toString();
    this.scoreRightElement.textContent = this.scoreRight.toString();
    // Game over message
    if (this.gameOver) {
      this.ctx.font = `bold 50px 'Verdana', sans-serif`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        this.scoreLeft >= 3 ? `${this.playerLeftName} Wins!` : `${this.playerRightName} Wins!`,
        this.baseWidth / 2,
        this.baseHeight / 2
      );
    }
  }

  // Attaches a back button listener to handle navigation
  public attachBackButtonListener(): void {
    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.addEventListener('click', () => {
        if (this.ws) {
          this.ws.close();
        }
        this.cleanup();
        this.navigate('/');
      });
    }
  }

  public cleanup(): void {
    // Remove event listeners, close WebSocket, etc.
  }

  // Computes the speed multiplier based on the speed slider
  public getSpeedMultiplier(): number {
    return parseInt(this.speedSlider.value) / 5;
  }

  private async recordMatch(winnerName: string, loserName: string, winnerScore: number, loserScore: number) {
    try {
      this.statsManager.recordMatch(winnerName, loserName, "Pong", {
        player1Score: winnerScore,
        player2Score: loserScore,
        sessionToken: localStorage.getItem("sessionToken")
      });
    } catch (error) {
      console.error('[DEBUG] Match recording error:', error);
    }
  }
} 