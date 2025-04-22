import { StatsManager } from "./stats.js";

// Manages the core game logic for Pong Transcendence
export class PongGame {
  // Canvas and context for rendering
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  // UI elements for game settings and scores
  protected speedSlider: HTMLInputElement;
  protected backgroundColorSelect: HTMLSelectElement | null;
  protected scoreLeftElement: HTMLSpanElement;
  protected scoreRightElement: HTMLSpanElement;
  protected restartButton: HTMLButtonElement;
  protected settingsButton: HTMLButtonElement;
  protected settingsMenu: HTMLDivElement;
  protected settingsContainer: HTMLDivElement;
  // Manages game statistics
  protected statsManager: StatsManager;
  // User email for settings persistence
  protected userEmail: string | null;
  // Navigation callback
  protected navigate: (path: string) => void;

  // Game state variables
  protected paddleLeftY: number = 160;
  protected paddleRightY: number = 160;
  protected ballX: number = 400;
  protected ballY: number = 200;
  protected ballSpeedX: number = 2.5;
  protected ballSpeedY: number = 1.5;
  protected scoreLeft: number = 0;
  protected scoreRight: number = 0;
  protected gameOver: boolean = false;
  protected gameStarted: boolean = false;
  protected isPaused: boolean = false;
  protected playerLeftName: string;
  protected playerRightName: string;
  protected backgroundColor: string = "#d8a8b5";
  protected onGameEnd?: (winnerName: string) => void;

  // Game constants
  protected paddleSpeed: number = 5;
  protected keys: Record<"w" | "s" | "ArrowUp" | "ArrowDown", boolean> = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false,
  };

  // Canvas dimensions and scaling
  protected baseWidth: number = 800;
  protected baseHeight: number = 400;
  protected scale: number = 1;

  // Initializes the game with player names and UI element IDs
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
    userEmail: string | null,
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
    this.userEmail = userEmail;
    this.onGameEnd = onGameEnd;
    this.navigate = navigate || (() => {});

    // Ensure restartButton is in buttonContainer
    const buttonContainer = document.getElementById("buttonContainer");
    if (buttonContainer && this.restartButton.parentElement !== buttonContainer) {
      buttonContainer.appendChild(this.restartButton);
    }

    // Attach event listener to the existing backButton
    const backButton = document.getElementById("backButton") as HTMLButtonElement;
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.cleanup();
        this.navigate("/welcome");
      });
    } else {
      console.error("Back button not found!");
    }

    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.draw();
  }

  // Cleans up event listeners
  public cleanup(): void {
    window.removeEventListener("resize", () => this.resizeCanvas());
  }

  // Resizes canvas based on browser window size and maintains aspect ratio
  protected resizeCanvas(): void {
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

    this.ballX = (this.baseWidth / 2) * this.scale;
    this.ballY = (this.baseHeight / 2) * this.scale;
    // Initialize ball speed with slider value
    const speedMultiplier = parseInt(this.speedSlider.value) / 5; // Assuming 5 is default slider value
    this.ballSpeedX = 2.5 * this.scale * speedMultiplier;
    this.ballSpeedY = 1.5 * this.scale * speedMultiplier;
    this.paddleLeftY = (this.baseHeight / 2 - 40) * this.scale;
    this.paddleRightY = (this.baseHeight / 2 - 40) * this.scale;
    this.paddleSpeed = 7 * this.scale;
  }

  // Sets up event listeners for game controls and settings
  protected setupEventListeners() {
    this.speedSlider.addEventListener("input", (e) => {
      const speed = parseInt((e.target as HTMLInputElement).value);
      // Update ball speed based on slider value
      const speedMultiplier = speed / 5; // Assuming 5 is default slider value
      this.ballSpeedX = 2.5 * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale * speedMultiplier;
      this.ballSpeedY = 1.5 * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale * speedMultiplier;
      if (this.userEmail) {
        this.statsManager.setUserSettings(this.userEmail, { ballSpeed: speed });
      }
    });

    if (this.backgroundColorSelect) {
      this.backgroundColorSelect.addEventListener("change", (e) => {
        this.backgroundColor = (e.target as HTMLSelectElement).value;
        if (this.userEmail) {
          this.statsManager.setUserSettings(this.userEmail, { backgroundColor: this.backgroundColor });
        }
      });
    } else {
      console.warn("Background color select element not found");
    }

    this.settingsButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.settingsMenu.classList.toggle("visible");
    });

    document.addEventListener("click", (e) => {
      if (!this.settingsContainer.contains(e.target as Node)) {
        this.settingsMenu.classList.remove("visible");
      }
    });

    this.restartButton.addEventListener("click", () => {
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.restartButton.style.display = "none";
      } else {
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.scoreLeftElement.textContent = "0";
        this.scoreRightElement.textContent = "0";
        this.gameOver = false;
        this.ballX = (this.baseWidth / 2) * this.scale;
        this.ballY = (this.baseHeight / 2) * this.scale;
        // Reset ball speed with slider value
        const speedMultiplier = parseInt(this.speedSlider.value) / 5; // Assuming 5 is default
        this.ballSpeedX = 2.5 * this.scale * speedMultiplier;
        this.ballSpeedY = 1.5 * this.scale * speedMultiplier;
        this.restartButton.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === " " && this.gameStarted) {
        this.isPaused = !this.isPaused;
      }
      if (["w", "s", "ArrowUp", "ArrowDown"].includes(e.key)) {
        this.keys[e.key as "w" | "s" | "ArrowUp" | "ArrowDown"] = true;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (["w", "s", "ArrowUp", "ArrowDown"].includes(e.key)) {
        this.keys[e.key as "w" | "s" | "ArrowUp" | "ArrowDown"] = false;
      }
    });
  }

  // Renders the game and updates game state
  protected draw() {
    // Clear canvas with background color
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw paddles
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(10 * this.scale, this.paddleLeftY, 20 * this.scale, 80 * this.scale);
    this.ctx.fillRect((this.baseWidth - 30) * this.scale, this.paddleRightY, 20 * this.scale, 80 * this.scale);

    // Update game state if not paused or over
    if (this.gameStarted && !this.isPaused && !this.gameOver) {
      // Move paddles based on key input
      if (this.keys.w && this.paddleLeftY > 0) this.paddleLeftY -= this.paddleSpeed;
      if (this.keys.s && this.paddleLeftY < this.canvas.height - 80 * this.scale) this.paddleLeftY += this.paddleSpeed;
      if (this.keys.ArrowUp && this.paddleRightY > 0) this.paddleRightY -= this.paddleSpeed;
      if (this.keys.ArrowDown && this.paddleRightY < this.canvas.height - 80 * this.scale) this.paddleRightY += this.paddleSpeed;

      // Update ball position
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Bounce off top and bottom walls
      if (this.ballY <= 10 * this.scale || this.ballY >= this.canvas.height - 10 * this.scale) {
        this.ballSpeedY = -this.ballSpeedY;
      }

      // Handle left paddle collision
      if (
        this.ballX - 10 * this.scale <= 30 * this.scale &&
        this.ballX + 10 * this.scale >= 10 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + 80 * this.scale
      ) {
        // Reverse horizontal velocity
        this.ballSpeedX = -this.ballSpeedX;
        // Reposition ball to prevent re-collision
        this.ballX = 30 * this.scale + 10 * this.scale; // Place right of paddle
      }

      // Handle right paddle collision
      if (
        this.ballX + 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX - 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + 80 * this.scale
      ) {
        // Reverse horizontal velocity
        this.ballSpeedX = -this.ballSpeedX;
        // Reposition ball to prevent re-collision
        this.ballX = (this.baseWidth - 30) * this.scale - 10 * this.scale; // Place left of paddle
      }

      // Handle scoring
      if (this.ballX < 0) {
        this.scoreRight++;
        this.scoreRightElement.textContent = this.scoreRight.toString();
        if (this.scoreRight >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block";
          const backButton = document.getElementById("backButton") as HTMLButtonElement;
          if (backButton) backButton.style.display = "block";
          this.statsManager.recordMatch(this.playerRightName, this.playerLeftName, {
            player1Score: this.scoreLeft,
            player2Score: this.scoreRight
          });
          if (this.onGameEnd) {
            this.onGameEnd(this.playerRightName);
          }
        } else {
          this.ballX = (this.baseWidth / 2) * this.scale;
          this.ballY = (this.baseHeight / 2) * this.scale;
          // Reset ball speed with slider value
          const speedMultiplier = parseInt(this.speedSlider.value) / 5; // Assuming 5 is default
          this.ballSpeedX = 2.5 * this.scale * speedMultiplier;
          this.ballSpeedY = 1.5 * this.scale * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
        }
      } else if (this.ballX > this.canvas.width) {
        this.scoreLeft++;
        this.scoreLeftElement.textContent = this.scoreLeft.toString();
        if (this.scoreLeft >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block";
          const backButton = document.getElementById("backButton") as HTMLButtonElement;
          if (backButton) backButton.style.display = "block";
          this.statsManager.recordMatch(this.playerLeftName, this.playerRightName, {
            player1Score: this.scoreLeft,
            player2Score: this.scoreRight
          });
          if (this.onGameEnd) {
            this.onGameEnd(this.playerLeftName);
          }
        } else {
          this.ballX = (this.baseWidth / 2) * this.scale;
          this.ballY = (this.baseHeight / 2) * this.scale;
          // Reset ball speed with slider value
          const speedMultiplier = parseInt(this.speedSlider.value) / 5; // Assuming 5 is default
          this.ballSpeedX = -2.5 * this.scale * speedMultiplier;
          this.ballSpeedY = 1.5 * this.scale * speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
        }
      }
    }

    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, 10 * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();

    // Display game over message
    if (this.gameOver) {
      this.ctx.font = `bold ${50 * this.scale}px 'Verdana', sans-serif`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.shadowColor = "rgba(0, 0, 255, 0.5)";
      this.ctx.shadowBlur = 10 * this.scale;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      this.ctx.fillText(
        this.scoreLeft >= 3 ? `${this.playerLeftName} Wins!` : `${this.playerRightName} Wins!`,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.ctx.shadowColor = "transparent";
      this.ctx.shadowBlur = 0;
    }

    // Continue animation loop
    requestAnimationFrame(() => this.draw());
  }
}