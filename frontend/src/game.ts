// PongGame class encapsulates all game logic
// Constructor takes DOM element IDs to initialize the game

export class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private speedSlider: HTMLInputElement;
  private backgroundColorSelect: HTMLSelectElement;
  private scoreLeftElement: HTMLSpanElement;
  private scoreRightElement: HTMLSpanElement;
  private restartButton: HTMLButtonElement;
  private settingsButton: HTMLButtonElement;
  private settingsMenu: HTMLDivElement;
  private settingsContainer: HTMLDivElement;

  private paddleLeftY: number = 160; // canvas.height / 2 - 40
  private paddleRightY: number = 160;
  private ballX: number = 400; // canvas.width / 2
  private ballY: number = 200; // canvas.height / 2
  private ballSpeedX: number = 5;
  private ballSpeedY: number = 3;
  private scoreLeft: number = 0;
  private scoreRight: number = 0;
  private gameOver: boolean = false;
  private gameStarted: boolean = false; // New flag to control game start
  private isPaused: boolean = false;
  private playerLeftName: string;
  private playerRightName: string;
  private backgroundColor: string = "#d8a8b5"; // Initial color: Pastel Pink

  private paddleSpeed: number = 5;
  private keys: Record<"w" | "s" | "ArrowUp" | "ArrowDown", boolean> = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false,
  };

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
    settingsContainerId: string
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

    this.setupEventListeners();
    this.draw();
  }

  private setupEventListeners() {
    // Speed slider
    this.speedSlider.addEventListener("input", (e) => {
      const speed = parseInt((e.target as HTMLInputElement).value);
      this.ballSpeedX = speed * (this.ballSpeedX / Math.abs(this.ballSpeedX));
      this.ballSpeedY = (speed * this.ballSpeedY) / Math.abs(this.ballSpeedX);
    });

    // Background color
    this.backgroundColorSelect.addEventListener("change", (e) => {
      this.backgroundColor = (e.target as HTMLSelectElement).value;
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

    // Start/Restart button
    this.restartButton.addEventListener("click", () => {
      if (!this.gameStarted) {
        // First click to start the game
        this.gameStarted = true;
        this.restartButton.style.display = "none"; // Hide the button after starting
      } else {
        // Subsequent clicks to restart
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.scoreLeftElement.textContent = "0";
        this.scoreRightElement.textContent = "0";
        this.gameOver = false;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX));
        this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY));
        this.restartButton.style.display = "none"; // Hide the button after restarting
      }
    });

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
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

  private draw() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(10, this.paddleLeftY, 20, 80);
    this.ctx.fillRect(this.canvas.width - 30, this.paddleRightY, 20, 80);

    if (this.gameStarted && !this.isPaused && !this.gameOver) {
      // Paddle movement
      if (this.keys.w && this.paddleLeftY > 0) this.paddleLeftY -= this.paddleSpeed;
      if (this.keys.s && this.paddleLeftY < this.canvas.height - 80) this.paddleLeftY += this.paddleSpeed;
      if (this.keys.ArrowUp && this.paddleRightY > 0) this.paddleRightY -= this.paddleSpeed;
      if (this.keys.ArrowDown && this.paddleRightY < this.canvas.height - 80) this.paddleRightY += this.paddleSpeed;

      // Ball movement
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Bounce off walls
      if (this.ballY <= 10 || this.ballY >= this.canvas.height - 10) {
        this.ballSpeedY = -this.ballSpeedY;
      }

      // Bounce off paddles
      if (
        this.ballX - 10 >= 10 &&
        this.ballX - 10 <= 30 &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + 80
      ) {
        const ballCenterY = this.ballY;
        const paddleCenterY = this.paddleLeftY + 40;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY += (ballCenterY - paddleCenterY) / 40 * 2;
      } else if (
        this.ballX + 10 >= 10 &&
        this.ballX + 10 <= 30 &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + 80
      ) {
        const ballCenterY = this.ballY;
        const paddleCenterY = this.paddleLeftY + 40;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY += (ballCenterY - paddleCenterY) / 40 * 2;
      } else if (
        this.ballX >= 10 &&
        this.ballX <= 30 &&
        (this.ballY - 10 <= this.paddleLeftY + 80 && this.ballY + 10 >= this.paddleLeftY)
      ) {
        this.ballSpeedY = -this.ballSpeedY;
      }

      if (
        this.ballX + 10 >= this.canvas.width - 30 &&
        this.ballX + 10 <= this.canvas.width - 10 &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + 80
      ) {
        const ballCenterY = this.ballY;
        const paddleCenterY = this.paddleRightY + 40;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY += (ballCenterY - paddleCenterY) / 40 * 2;
      } else if (
        this.ballX - 10 >= this.canvas.width - 30 &&
        this.ballX - 10 <= this.canvas.width - 10 &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + 80
      ) {
        const ballCenterY = this.ballY;
        const paddleCenterY = this.paddleRightY + 40;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY += (ballCenterY - paddleCenterY) / 40 * 2;
      } else if (
        this.ballX >= this.canvas.width - 30 &&
        this.ballX <= this.canvas.width - 10 &&
        (this.ballY - 10 <= this.paddleRightY + 80 && this.ballY + 10 >= this.paddleRightY)
      ) {
        this.ballSpeedY = -this.ballSpeedY;
      }

      // Scoring
      if (this.ballX < 0) {
        this.scoreRight++;
        this.scoreRightElement.textContent = this.scoreRight.toString();
        if (this.scoreRight >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block"; // Show the button when game ends
        } else {
          this.ballX = this.canvas.width / 2;
          this.ballY = this.canvas.height / 2;
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX));
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY));
        }
      } else if (this.ballX > this.canvas.width) {
        this.scoreLeft++;
        this.scoreLeftElement.textContent = this.scoreLeft.toString();
        if (this.scoreLeft >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block"; // Show the button when game ends
        } else {
          this.ballX = this.canvas.width / 2;
          this.ballY = this.canvas.height / 2;
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX));
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY));
        }
      }
    }

    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();

    if (this.gameOver) {
      this.ctx.font = "bold 50px 'Verdana', sans-serif";
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.shadowColor = "rgba(0, 0, 255, 0.5)";
      this.ctx.shadowBlur = 10;
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

    requestAnimationFrame(() => this.draw());
  }
}