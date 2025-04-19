import { StatsManager } from "./stats";

// Manages the core game logic for Pong Transcendence
export class PongGame {
  // Canvas and context for rendering
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  // UI elements for game settings and scores
  protected speedSlider: HTMLInputElement;
  protected backgroundColorSelect: HTMLSelectElement;
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
  // Button to navigate back to welcome page
  protected backButton: HTMLButtonElement;
  // Navigation callback
  protected navigate: (path: string) => void;

  // Game state variables
  protected paddleLeftY: number = 160;
  protected paddleRightY: number = 160;
  protected ballX: number = 400;
  protected ballY: number = 200;
  protected ballSpeedX: number = 5;
  protected ballSpeedY: number = 3;
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
    this.backgroundColorSelect = document.getElementById(backgroundColorSelectId) as HTMLSelectElement;
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

    // Create and style back button
    this.backButton = document.createElement("button");
    this.backButton.textContent = "Back";
    this.backButton.classList.add("back-button");
    this.backButton.addEventListener("click", () => {
      this.cleanup();
      this.navigate("/welcome");
    });

    // Append buttons to button container
    const buttonContainer = document.getElementById("buttonContainer");
    if (buttonContainer) {
      buttonContainer.appendChild(this.backButton);
      // Ensure restartButton is in buttonContainer
      if (this.restartButton.parentElement !== buttonContainer) {
        buttonContainer.appendChild(this.restartButton);
      }
    } else {
      console.error("Button container not found, appending buttons to body instead");
      document.body.appendChild(this.backButton);
      document.body.appendChild(this.restartButton);
    }

    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.draw();
  }

  // Cleans up event listeners and removes buttons
  public cleanup(): void {
    if (this.backButton) {
      this.backButton.remove();
    }
    window.removeEventListener("resize", () => this.resizeCanvas());
  }

  // Resizes canvas based on browser window size and maintains aspect ratio
  protected resizeCanvas(): void {
    const maxWidth = window.innerWidth * 0.9; // Use 90% of browser width
    const maxHeight = window.innerHeight * 0.9; // Use 90% of browser height
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

    // Center the canvas
    this.canvas.style.display = "block";
    this.canvas.style.margin = "auto";

    this.ballX = (this.baseWidth / 2) * this.scale;
    this.ballY = (this.baseHeight / 2) * this.scale;
    this.paddleLeftY = (this.baseHeight / 2 - 40) * this.scale;
    this.paddleRightY = (this.baseHeight / 2 - 40) * this.scale;
    this.ballSpeedX = 5 * this.scale;
    this.ballSpeedY = 3 * this.scale;
    this.paddleSpeed = 5 * this.scale;
  }

  // Sets up event listeners for game controls and settings
  protected setupEventListeners() {
    // Adjust ball speed based on slider input
    this.speedSlider.addEventListener("input", (e) => {
      const speed = parseInt((e.target as HTMLInputElement).value);
      this.ballSpeedX = speed * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale;
      this.ballSpeedY = (speed * this.ballSpeedY) / Math.abs(this.ballSpeedX) * this.scale;
      if (this.userEmail) {
        this.statsManager.setUserSettings(this.userEmail, { ballSpeed: speed });
      }
    });

    // Update background color based on selection
    this.backgroundColorSelect.addEventListener("change", (e) => {
      this.backgroundColor = (e.target as HTMLSelectElement).value;
      if (this.userEmail) {
        this.statsManager.setUserSettings(this.userEmail, { backgroundColor: this.backgroundColor });
      }
    });

    // Toggle settings menu visibility
    this.settingsButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.settingsMenu.classList.toggle("visible");
    });

    // Close settings menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.settingsContainer.contains(e.target as Node)) {
        this.settingsMenu.classList.remove("visible");
      }
    });

    // Handle game start/restart
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
        this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale;
        this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale;
        this.restartButton.style.display = "none";
      }
    });

    // Handle keyboard controls
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

      // Bounce off left paddle
      if (
        this.ballX - 10 * this.scale >= 10 * this.scale &&
        this.ballX - 10 * this.scale <= 30 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + 80 * this.scale
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX + 10 * this.scale >= 10 * this.scale &&
        this.ballX + 10 * this.scale <= 30 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + 80 * this.scale
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX >= 10 * this.scale &&
        this.ballX <= 30 * this.scale &&
        (this.ballY - 10 * this.scale <= this.paddleLeftY + 80 * this.scale && this.ballY + 10 * this.scale >= this.paddleLeftY)
      ) {
        this.ballSpeedY = -this.ballSpeedY;
        if (this.ballY < this.paddleLeftY + 40 * this.scale) {
          this.ballY = this.paddleLeftY - 10 * this.scale; // Place above paddle
        } else {
          this.ballY = this.paddleLeftY + 80 * this.scale + 10 * this.scale; // Place below paddle
        }
      }

      // Bounce off right paddle
      if (
        this.ballX + 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX + 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + 80 * this.scale
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX - 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX - 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + 80 * this.scale
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX >= (this.baseWidth - 30) * this.scale &&
        this.ballX <= (this.baseWidth - 10) * this.scale &&
        (this.ballY - 10 * this.scale <= this.paddleRightY + 80 * this.scale && this.ballY + 10 * this.scale >= this.paddleRightY)
      ) {
        this.ballSpeedY = -this.ballSpeedY;
        if (this.ballY < this.paddleRightY + 40 * this.scale) {
          this.ballY = this.paddleRightY - 10 * this.scale; // Place above paddle
        } else {
          this.ballY = this.paddleRightY + 80 * this.scale + 10 * this.scale; // Place below paddle
        }
      }

      // Handle scoring
      if (this.ballX < 0) {
        this.scoreRight++;
        this.scoreRightElement.textContent = this.scoreRight.toString();
        if (this.scoreRight >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block";
          this.backButton.style.display = "block";
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
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale;
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale;
        }
      } else if (this.ballX > this.canvas.width) {
        this.scoreLeft++;
        this.scoreLeftElement.textContent = this.scoreLeft.toString();
        if (this.scoreLeft >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block";
          this.backButton.style.display = "block";
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
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale;
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale;
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