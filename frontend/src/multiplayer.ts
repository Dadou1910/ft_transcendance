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
  public animationFrameId: number | null = null;

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
    navigate?: (path: string) => void,
    onGameEnd?: (winnerName: string) => void
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
    this.navigate = navigate || (() => {});
    this.onGameEnd = onGameEnd;
    // Set initial ball speed using base values and speed multiplier
    const speedMultiplier = this.getSpeedMultiplier();
    this.ballSpeedX = this.baseBallSpeedX * this.scale * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = this.baseBallSpeedY * this.scale * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    // Ensure Back button is always visible
    const backButton = document.getElementById("backButton") as HTMLButtonElement;
    if (backButton) {
      backButton.style.display = "block";
      backButton.onclick = () => {
        // Send cleanup message to both players
        if (this.ws) {
          this.ws.send(JSON.stringify({ type: "cleanup", reason: "opponent_left" }));
        }
        if (this.ws) {
          this.ws.close();
        }
        this.cleanup();
        this.navigate("/");
      };
    }
    // Multiplayer-specific setup (WebSocket, etc.) will be added here
  }

  public handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case "opponent":
        // Update opponent name when they join
        if (this.isHost) {
          this.playerRightName = data.name;
        } else {
          this.playerLeftName = data.name;
        }
        // Update both DOM elements for robustness
        const rightNameElem = document.getElementById("playerRightNameDisplay");
        if (rightNameElem) rightNameElem.textContent = this.playerRightName;
        const leftNameElem = document.getElementById("playerLeftNameDisplay");
        if (leftNameElem) leftNameElem.textContent = this.playerLeftName;
        break;
      case "game_start":
        this.gameStarted = true;
        this.isPaused = false;
        this.gameOver = false;
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.scoreLeftElement.textContent = "0";
        this.scoreRightElement.textContent = "0";
        this.paddleLeftY = 160;
        this.paddleRightY = 160;
        this.ballX = 400;
        this.ballY = 200;
        this.ballSpeedX = 6.0;
        this.ballSpeedY = 4.1;
        this.restartButton.style.display = "none";
        this.pollForGameStart();
        break;
      case "paddle":
        this.handlePaddleMessage(data);
        break;
      case "state":
        this.handleStateMessage(data);
        break;
      case "gameOver":
        this.handleGameOver(data.winnerName);
        break;
      case "cleanup":
        if (data.reason === "opponent_left") {
          alert("The other player has left the game. You have been redirected to the welcome page.");
        }
        // Only close the WebSocket, do not call cleanup or navigate
        if (this.ws) {
          this.ws.close();
        }
        break;
    }
  }

  public setupWebSocket(ws: WebSocket, isHost: boolean, opponentName: string) {
    this.ws = ws;
    this.isHost = isHost;
    this.opponentName = opponentName;

    // Update player names in the UI
    if (isHost) {
      this.playerLeftName = this.userName || "";
      const leftNameElem = document.getElementById("playerLeftNameDisplay");
      if (leftNameElem) leftNameElem.textContent = this.playerLeftName;
      if (opponentName && opponentName !== "Waiting for opponent...") {
        this.playerRightName = opponentName;
        const rightNameElem = document.getElementById("playerRightNameDisplay");
        if (rightNameElem) rightNameElem.textContent = opponentName;
      }
    } else {
      this.playerRightName = this.userName || "";
      const rightNameElem = document.getElementById("playerRightNameDisplay");
      if (rightNameElem) rightNameElem.textContent = this.playerRightName;
      if (opponentName && opponentName !== "Waiting for opponent...") {
        this.playerLeftName = opponentName;
        const leftNameElem = document.getElementById("playerLeftNameDisplay");
        if (leftNameElem) leftNameElem.textContent = opponentName;
      }
    }

    // Start/Restart button
    this.restartButton.addEventListener("click", () => {
      if (!this.gameStarted) {
        this.localPlayerReady = true;
        if (this.isHost) {
          if (this.remotePlayerReady) {
            this.ws?.send(JSON.stringify({ type: 'game_start' }));
          } else {
            this.ws?.send(JSON.stringify({ type: 'ready' }));
            this.restartButton.disabled = true;
            this.restartButton.textContent = "Waiting for opponent...";
          }
        } else {
          this.ws?.send(JSON.stringify({ type: 'ready' }));
          this.restartButton.disabled = true;
          this.restartButton.textContent = "Waiting for opponent...";
        }
      }
    });

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

    // Settings menu toggle
    this.settingsButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.settingsMenu.classList.toggle("visible");
    });

    document.addEventListener("click", (e) => {
      if (!this.settingsContainer.contains(e.target as Node)) {
        this.settingsMenu.classList.remove("visible");
      }
    });
  }

  

  private handleGameOver(winnerName: string): void {
    this.gameOver = true;
    this.ballSpeedX = 0;
    this.ballSpeedY = 0;
    this.restartButton.style.display = "none";
    
    // Only attempt to record match if we're the host and the WebSocket is still open
    if (this.isHost && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const loserName = winnerName === this.playerLeftName ? this.playerRightName : this.playerLeftName;
        this.statsManager.recordMatch(winnerName, loserName, "Online Pong", {
          player1Score: this.scoreLeft,
          player2Score: this.scoreRight,
          sessionToken: localStorage.getItem("sessionToken")
        });
      } catch (error) {
        console.error('[DEBUG] Match recording error:', error);
      }
    }
    
    // Call onGameEnd callback if it exists and hasn't been triggered yet
    if (this.onGameEnd) {
      this.hasTriggeredGameEnd = true;
      this.onGameEnd(winnerName);
    }
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
        console.log('[DEBUG] Poll: gameStarted detected, game loop started');
        this.startGameLoop();
        this.gameLoopRunning = true;
      } else {
        requestAnimationFrame(poll);
      }
    };
    requestAnimationFrame(poll);
  }

  // Host: runs the game loop and sends state to guest
  public startGameLoop() {
    const loop = (timestamp: number) => {
      if (!this.gameStarted) {
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
            gameStarted: this.gameStarted
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

    // Target 60 FPS for normalization (1/60 seconds per frame)
    const frameTime = 1 / 60;
    const deltaTimeFactor = deltaTime / frameTime; // Scale movements to match 60 FPS

    // Paddle movement
    if (this.keys.w && this.paddleLeftY > 0) this.paddleLeftY -= this.paddleSpeed * deltaTimeFactor;
    if (this.keys.s && this.paddleLeftY < this.baseHeight - 80) this.paddleLeftY += this.paddleSpeed * deltaTimeFactor;
    if (this.keys.ArrowUp && this.paddleRightY > 0) this.paddleRightY -= this.paddleSpeed * deltaTimeFactor;
    if (this.keys.ArrowDown && this.paddleRightY < this.baseHeight - 80) this.paddleRightY += this.paddleSpeed * deltaTimeFactor;
    
    // Ball movement
    this.ballX += this.ballSpeedX * deltaTimeFactor;
    this.ballY += this.ballSpeedY * deltaTimeFactor;
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
      const winnerName = this.scoreLeft >= 3 ? this.playerLeftName : this.playerRightName;
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'gameOver', winnerName }));
      }
      this.handleGameOver(winnerName);
    }
  }

  private resetBall() {
    this.ballX = this.baseWidth / 2;
    this.ballY = this.baseHeight / 2;
    const speedMultiplier = this.getSpeedMultiplier();
    this.ballSpeedX = this.baseBallSpeedX * this.scale * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = this.baseBallSpeedY * this.scale * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
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
      this.ctx.font = `bold ${50 * this.scale}px 'Verdana', sans-serif`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.shadowColor = "rgba(0, 0, 255, 0.5)";
      this.ctx.shadowBlur = 10 * this.scale;
      this.ctx.fillText(
        this.scoreLeft >= 3 ? `${this.playerLeftName} Wins!` : `${this.playerRightName} Wins!`,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.ctx.shadowColor = "transparent";
      this.ctx.shadowBlur = 0;
    }
  }

  // Attaches a back button listener to handle navigation
  public attachBackButtonListener(): void {
    const backButton = document.getElementById("backButton") as HTMLButtonElement;
    if (backButton) {
      backButton.style.display = "block";
      backButton.onclick = () => {
        // Send cleanup message to both players
        if (this.ws) {
          this.ws.send(JSON.stringify({ type: "cleanup", reason: "opponent_left" }));
        }
        if (this.ws) {
          this.ws.close();
        }
        this.cleanup();
        this.navigate("/");
      };
    }
  }

  public cleanup(): void {
    // Send cleanup message to both players
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: "cleanup" }));
    }
    if (this.ws) {
      this.ws.close();
    }
    window.removeEventListener("resize", () => this.resizeCanvas());
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.gameLoopRunning) {
      this.gameLoopRunning = false;
    }
  }

  // Computes the speed multiplier based on the speed slider
  public getSpeedMultiplier(): number {
    return parseInt(this.speedSlider.value) / 5;
  }

  private async recordMatch(winnerName: string, loserName: string, winnerScore: number, loserScore: number) {
    try {
      this.statsManager.recordMatch(winnerName, loserName, "Online Pong", {
        player1Score: winnerScore,
        player2Score: loserScore,
        sessionToken: localStorage.getItem("sessionToken")
      });
    } catch (error) {
      console.error('[DEBUG] Match recording error:', error);
    }
  }

  private resizeCanvas(): void {
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;
    const aspectRatio = this.baseWidth / this.baseHeight;

    let newWidth = Math.min(maxWidth, this.baseWidth);
    let newHeight = newWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    this.scale = newWidth / this.baseWidth;
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    this.canvas.style.display = "block";
    this.canvas.style.margin = "auto";
  }
}