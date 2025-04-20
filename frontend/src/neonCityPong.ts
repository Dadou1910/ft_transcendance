import { PongGame } from "./game.js";
import { StatsManager } from "./stats.js";

// Defines interfaces for buildings and power-ups used in the game
interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  image: HTMLImageElement;
}

interface PowerUp {
  x: number;
  y: number;
  type: "speedBoost" | "paddleExtend";
  active: boolean;
}

// Extends the base PongGame class to create a neon-themed version with additional features
export class NeonCityPong extends PongGame {
  // Array to store building objects for the background
  private buildings: Building[];
  // Array to store power-up objects
  private powerUps: PowerUp[];
  // Timer to control power-up spawning
  private powerUpTimer: number;
  // Constant for power-up spawn interval
  private readonly POWER_UP_SPAWN_INTERVAL: number;
  // Stores the animation frame ID for the game loop
  private animationFrameId: number | null = null;
  // Back button element for navigation
  protected backButton: HTMLButtonElement;
  // Heights for left and right paddles, which can change with power-ups
  private paddleLeftHeight: number = 80;
  private paddleRightHeight: number = 80;
  // Function to navigate to different routes
  protected navigate: (path: string) => void;
  // Offscreen canvas for static background
  private backgroundCanvas: HTMLCanvasElement | null = null;
  private backgroundCtx: CanvasRenderingContext2D | null = null;
  // Reference to background color select element
  protected backgroundColorSelect: HTMLSelectElement | null = null;
  // Static background image
  private backgroundImage: HTMLImageElement | null = null;

  // Constructor initializes the game with player names, DOM element IDs, and other dependencies
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
    navigate: (path: string) => void,
    onGameEnd?: (winnerName: string) => void
  ) {
    // Calls the parent class constructor
    super(
      playerLeftName,
      playerRightName,
      canvasId,
      speedSliderId,
      backgroundColorSelectId,
      scoreLeftId,
      scoreRightId,
      restartButtonId,
      settingsButtonId,
      settingsMenuId,
      settingsContainerId,
      statsManager,
      userEmail,
      onGameEnd,
      navigate
    );
    this.navigate = navigate;
    // Checks if canvas context is initialized
    if (!this.ctx) {
      console.error("Canvas context not initialized!");
      throw new Error("Failed to get 2D canvas context");
    }
    // Initialize building image
    const buildingImage = new Image();
    buildingImage.src = "assets/buildingBlock.png";
    // Initializes buildings with position, size, speed, and image
    this.buildings = [
      { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, image: buildingImage },
      { x: 300 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, image: buildingImage },
      { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, image: buildingImage },
    ];
    // Initializes empty power-ups array
    this.powerUps = [];
    // Sets initial power-up timer
    this.powerUpTimer = 0;
    // Sets power-up spawn interval
    this.POWER_UP_SPAWN_INTERVAL = 500;

    // Creates and styles the back button
    this.backButton = document.createElement("button");
    this.backButton.textContent = "Back";
    this.backButton.classList.add("back-button");
    // Adds click event to navigate to welcome page
    this.backButton.addEventListener("click", () => {
      this.cleanup();
      this.navigate("/welcome");
    });

    // Appends buttons to button container
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

    // Initialize background image
    this.backgroundImage = new Image();
    this.backgroundImage.src = "assets/buildingBackground.png";
    this.backgroundImage.onload = () => {
      console.log("Background image loaded successfully");
      this.initBackgroundCanvas();
    };
    this.backgroundImage.onerror = () => {
      console.error("Failed to load background image");
    };

    // Logs initialization details
    console.log("NeonCityPong initialized:", {
      buildings: this.buildings,
      powerUps: this.powerUps,
      powerUpTimer: this.powerUpTimer,
      POWER_UP_SPAWN_INTERVAL: this.POWER_UP_SPAWN_INTERVAL,
    });

    // Binds methods to the class instance
    this.draw = this.draw.bind(this);
    this.drawBuildings = this.drawBuildings.bind(this);
    this.drawPowerUps = this.drawPowerUps.bind(this);
    this.spawnPowerUp = this.spawnPowerUp.bind(this);
    this.checkPowerUpCollision = this.checkPowerUpCollision.bind(this);
    this.checkBuildingCollision = this.checkBuildingCollision.bind(this);

    // Resizes canvas, initializes background, and starts animation
    this.resizeCanvas();
    this.initBackgroundCanvas();
    window.addEventListener("resize", () => {
      this.resizeCanvas();
      this.initBackgroundCanvas();
    });
    this.startAnimation();
  }

  // Initializes the offscreen background canvas
  private initBackgroundCanvas(): void {
    if (!this.canvas) return;
    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundCanvas.width = this.canvas.width;
    this.backgroundCanvas.height = this.canvas.height;
    this.backgroundCtx = this.backgroundCanvas.getContext("2d");
    if (!this.backgroundCtx) {
      console.error("Failed to get 2D context for background canvas");
      return;
    }
    this.drawNeonBackground(this.backgroundCtx);
  }

  // Resizes the canvas based on browser window size and maintains aspect ratio
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

    // Updates scale and canvas dimensions
    this.scale = newWidth / this.baseWidth;
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Center the canvas
    this.canvas.style.display = "block";
    this.canvas.style.margin = "auto";

    // Resets game elements positions and speeds
    this.ballX = (this.baseWidth / 2) * this.scale;
    this.ballY = (this.baseHeight / 2) * this.scale;
    this.paddleLeftY = (this.baseHeight / 2 - 40) * this.scale;
    this.paddleRightY = (this.baseHeight / 2 - 40) * this.scale;
    this.ballSpeedX = 5 * this.scale;
    this.ballSpeedY = 3 * this.scale;
    this.paddleSpeed = 5 * this.scale;
    this.paddleLeftHeight = 80 * this.scale;
    this.paddleRightHeight = 80 * this.scale;

    // Reinitializes buildings with scaled values
    const buildingImage = new Image();
    buildingImage.src = "assets/buildingBlock.png";
    this.buildings = [
      { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, image: buildingImage },
      { x: 300 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, image: buildingImage },
      { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, image: buildingImage },
    ];
    this.powerUps = [];
    this.powerUpTimer = 0;
  }

  // Starts the animation loop
  private startAnimation(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.draw);
    }
  }

  // Cleans up resources when the game is stopped
  public cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log("Animation loop stopped for NeonCityPong");
    }
    if (this.backButton) {
      this.backButton.remove();
    }
    window.removeEventListener("resize", () => {
      this.resizeCanvas();
      this.initBackgroundCanvas();
    });
  }

  // Spawns a power-up at a random position near a paddle
  private spawnPowerUp(): void {
    const type = Math.random() > 0.5 ? "speedBoost" : "paddleExtend";
    const isLeftPaddle = Math.random() > 0.5;
    const x = isLeftPaddle ? 20 * this.scale : (this.baseWidth - 20) * this.scale;
    const y = Math.random() * (this.canvas.height - 20 * this.scale) + 10 * this.scale;

    if (!this.powerUps) {
      console.warn("powerUps array is undefined, reinitializing...");
      this.powerUps = [];
    }
    this.powerUps.push({ x, y, type, active: true });
  }

  // Draws the neon-themed background
  private drawNeonBackground(ctx: CanvasRenderingContext2D): void {
    console.log("Drawing neon background");
    const canvas = ctx.canvas;
    // Use the selected background color or default to #1A1A2E
    ctx.fillStyle = this.backgroundColorSelect?.value || "#1A1A2E";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the static background image, stretched to fit canvas width and aligned at the bottom
    if (this.backgroundImage && this.backgroundImage.complete && this.backgroundImage.naturalWidth !== 0) {
      const imgWidth = canvas.width; // Stretch to full canvas width
      const aspectRatio = this.backgroundImage.naturalWidth / this.backgroundImage.naturalHeight;
      const imgHeight = imgWidth / aspectRatio; // Maintain original aspect ratio
      const imgY = canvas.height - imgHeight + 200 * this.scale; // Shift downward by 200 scaled pixels
      ctx.drawImage(this.backgroundImage, 0, imgY, imgWidth, imgHeight);
    } else {
      console.warn("Background image not loaded, skipping draw");
    }
  }

  // Draws moving buildings in the background
  private drawBuildings(ctx: CanvasRenderingContext2D): void {
    console.log("Drawing buildings");
    if (!this.buildings) {
      console.warn("Buildings array is undefined, reinitializing...");
      const buildingImage = new Image();
      buildingImage.src = "assets/buildingBlock.png";
      this.buildings = [
        { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, image: buildingImage },
        { x: 300 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, image: buildingImage },
        { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, image: buildingImage },
      ];
    }
    this.buildings.forEach(building => {
      ctx.save();
      building.y += building.speed;
      if (building.y < -building.height) building.y = this.canvas.height;
      if (building.y > this.canvas.height) building.y = -building.height;

      if (building.image && building.image.complete && building.image.naturalWidth !== 0) {
        ctx.drawImage(building.image, building.x, building.y, building.width, building.height);
      } else {
        console.warn("Building image not loaded for building at x:", building.x);
      }
      ctx.restore();
    });
  }

  // Draws active power-ups on the canvas
  private drawPowerUps(ctx: CanvasRenderingContext2D): void {
    console.log("Drawing power-ups");
    if (!this.powerUps) {
      console.warn("powerUps array is undefined, reinitializing...");
      this.powerUps = [];
    }
    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return;
      ctx.fillStyle = powerUp.type === "speedBoost" ? "#FF00FF" : "#00FFFF";
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, 10 * this.scale, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Checks for collisions between power-ups and paddles
  private checkPowerUpCollision(): void {
    if (!this.powerUps) {
      console.warn("powerUps array is undefined, reinitializing...");
      this.powerUps = [];
    }
    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return;

      // Defines left paddle boundaries
      const leftPaddle = {
        x: 10 * this.scale,
        y: this.paddleLeftY,
        width: 20 * this.scale,
        height: this.paddleLeftHeight,
      };
      // Checks collision with left paddle
      if (
        powerUp.x + 10 * this.scale > leftPaddle.x &&
        powerUp.x - 10 * this.scale < leftPaddle.x + leftPaddle.width &&
        powerUp.y + 10 * this.scale > leftPaddle.y &&
        powerUp.y - 10 * this.scale < leftPaddle.y + leftPaddle.height
      ) {
        powerUp.active = false;
        if (powerUp.type === "speedBoost") {
          this.ballSpeedX *= 1.5;
          this.ballSpeedY *= 1.5;
          console.log("Speed Boost activated for left paddle!");
        } else if (powerUp.type === "paddleExtend") {
          this.paddleLeftHeight = 120 * this.scale;
          console.log("Left paddle extended!");
          setTimeout(() => {
            this.paddleLeftHeight = 80 * this.scale;
            console.log("Left paddle reverted to normal size");
          }, 5000);
        }
      }

      // Defines right paddle boundaries
      const rightPaddle = {
        x: (this.baseWidth - 30) * this.scale,
        y: this.paddleRightY,
        width: 20 * this.scale,
        height: this.paddleRightHeight,
      };
      // Checks collision with right paddle
      if (
        powerUp.x + 10 * this.scale > rightPaddle.x &&
        powerUp.x - 10 * this.scale < rightPaddle.x + rightPaddle.width &&
        powerUp.y + 10 * this.scale > rightPaddle.y &&
        powerUp.y - 10 * this.scale < rightPaddle.y + rightPaddle.height
      ) {
        powerUp.active = false;
        if (powerUp.type === "speedBoost") {
          this.ballSpeedX *= 1.5;
          this.ballSpeedY *= 1.5;
          console.log("Speed Boost activated for right paddle!");
        } else if (powerUp.type === "paddleExtend") {
          this.paddleRightHeight = 120 * this.scale;
          console.log("Right paddle extended!");
          setTimeout(() => {
            this.paddleRightHeight = 80 * this.scale;
            console.log("Right paddle reverted to normal size");
          }, 5000);
        }
      }
    });
  }

  // Checks for collisions between the ball and buildings
  private checkBuildingCollision(): void {
    if (!this.buildings) {
      console.warn("Buildings array is undefined, reinitializing...");
      const buildingImage = new Image();
      buildingImage.src = "assets/buildingBlock.png";
      this.buildings = [
        { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, image: buildingImage },
        { x: 300 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, image: buildingImage },
        { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, image: buildingImage },
      ];
    }
    this.buildings.forEach(building => {
      if (
        this.ballX + 10 * this.scale > building.x &&
        this.ballX - 10 * this.scale < building.x + building.width &&
        this.ballY + 10 * this.scale > building.y &&
        this.ballY - 10 * this.scale < building.y + building.height
      ) {
        // Determines which side of the building the ball hit
        const ballLeft = this.ballX - 10 * this.scale;
        const ballRight = this.ballX + 10 * this.scale;
        const ballTop = this.ballY - 10 * this.scale;
        const ballBottom = this.ballY + 10 * this.scale;

        const leftDiff = Math.abs(ballRight - building.x);
        const rightDiff = Math.abs(ballLeft - (building.x + building.width));
        const topDiff = Math.abs(ballBottom - building.y);
        const bottomDiff = Math.abs(ballTop - (building.y + building.height));

        const minDiff = Math.min(leftDiff, rightDiff, topDiff, bottomDiff);

        // Reposition ball to prevent sticking
        if (minDiff === leftDiff) {
          this.ballX = building.x - 10 * this.scale; // Move left of building
          this.ballSpeedX = -Math.abs(this.ballSpeedX); // Ensure moving left
        } else if (minDiff === rightDiff) {
          this.ballX = building.x + building.width + 10 * this.scale; // Move right of building
          this.ballSpeedX = Math.abs(this.ballSpeedX); // Ensure moving right
        } else if (minDiff === topDiff) {
          this.ballY = building.y - 10 * this.scale; // Move above building
          this.ballSpeedY = -Math.abs(this.ballSpeedY); // Ensure moving up
        } else if (minDiff === bottomDiff) {
          this.ballY = building.y + building.height + 10 * this.scale; // Move below building
          this.ballSpeedY = Math.abs(this.ballSpeedY); // Ensure moving down
        }
      }
    });
  }

  // Sets up event listeners for game controls and settings
  protected setupEventListeners() {
    super.setupEventListeners();

    // Add additional listener for background color change to update the neon background
    if (this.backgroundColorSelect) {
      this.backgroundColorSelect.addEventListener("change", () => {
        console.log("Background color changed to:", this.backgroundColorSelect!.value);
        this.initBackgroundCanvas();
      });
    } else {
      console.warn("Background color select element not found");
    }
  }

  // Main draw loop for rendering the game
  protected draw(): void {
    if (!this.ctx) {
      console.error("Canvas context is null");
      return;
    }

    // Clear the main canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the pre-rendered background
    if (this.backgroundCanvas) {
      this.ctx.drawImage(this.backgroundCanvas, 0, 0);
    } else {
      console.warn("Background canvas not initialized, reinitializing...");
      this.initBackgroundCanvas();
      if (this.backgroundCanvas) {
        this.ctx.drawImage(this.backgroundCanvas, 0, 0);
      }
    }

    // Draw buildings
    this.drawBuildings(this.ctx);

    // Draw paddles with dynamic height
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(10 * this.scale, this.paddleLeftY, 20 * this.scale, this.paddleLeftHeight);
    this.ctx.fillRect((this.baseWidth - 30) * this.scale, this.paddleRightY, 20 * this.scale, this.paddleRightHeight);

    // Update game state if the game is active
    if (this.gameStarted && !this.isPaused && !this.gameOver) {
      // Handle paddle movement based on key inputs
      if (this.keys.w && this.paddleLeftY > 0) this.paddleLeftY -= this.paddleSpeed;
      if (this.keys.s && this.paddleLeftY < this.canvas.height - this.paddleLeftHeight) this.paddleLeftY += this.paddleSpeed;
      if (this.keys.ArrowUp && this.paddleRightY > 0) this.paddleRightY -= this.paddleSpeed;
      if (this.keys.ArrowDown && this.paddleRightY < this.canvas.height - this.paddleRightHeight) this.paddleRightY += this.paddleSpeed;

      // Update ball position
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Bounce ball off top and bottom walls
      if (this.ballY <= 10 * this.scale || this.ballY >= this.canvas.height - 10 * this.scale) {
        this.ballSpeedY = -this.ballSpeedY;
      }

      // Handle ball collision with left paddle
      if (
        this.ballX - 10 * this.scale >= 10 * this.scale &&
        this.ballX - 10 * this.scale <= 30 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + this.paddleLeftHeight
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX + 10 * this.scale >= 10 * this.scale &&
        this.ballX + 10 * this.scale <= 30 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + this.paddleLeftHeight
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX >= 10 * this.scale &&
        this.ballX <= 30 * this.scale &&
        (this.ballY - 10 * this.scale <= this.paddleLeftY + this.paddleLeftHeight && this.ballY + 10 * this.scale >= this.paddleLeftY)
      ) {
        this.ballSpeedY = -this.ballSpeedY;
        if (this.ballY < this.paddleLeftY + this.paddleLeftHeight / 2) {
          this.ballY = this.paddleLeftY - 10 * this.scale; // Place above paddle
        } else {
          this.ballY = this.paddleLeftY + this.paddleLeftHeight + 10 * this.scale; // Place below paddle
        }
      }

      // Handle ball collision with right paddle
      if (
        this.ballX + 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX + 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + this.paddleRightHeight
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX - 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX - 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + this.paddleRightHeight
      ) {
        this.ballSpeedX = -this.ballSpeedX;
      } else if (
        this.ballX >= (this.baseWidth - 30) * this.scale &&
        this.ballX <= (this.baseWidth - 10) * this.scale &&
        (this.ballY - 10 * this.scale <= this.paddleRightY + this.paddleRightHeight && this.ballY + 10 * this.scale >= this.paddleRightY)
      ) {
        this.ballSpeedY = -this.ballSpeedY;
        if (this.ballY < this.paddleRightY + this.paddleRightHeight / 2) {
          this.ballY = this.paddleRightY - 10 * this.scale; // Place above paddle
        } else {
          this.ballY = this.paddleRightY + this.paddleRightHeight + 10 * this.scale; // Place below paddle
        }
      }

      // Check for ball collisions with buildings
      this.checkBuildingCollision();

      // Manage power-up spawning and collisions
      this.powerUpTimer++;
      if (this.powerUpTimer >= this.POWER_UP_SPAWN_INTERVAL) {
        this.spawnPowerUp();
        this.powerUpTimer = 0;
      }
      this.checkPowerUpCollision();

      // Handle scoring and game over conditions
      if (this.ballX < 0) {
        this.scoreRight++;
        this.scoreRightElement.textContent = this.scoreRight.toString();
        if (this.scoreRight >= 3) {
          this.gameOver = true;
          this.restartButton.style.display = "block";
          this.backButton.style.display = "block";
          this.statsManager.recordMatch(this.playerRightName, this.playerLeftName, {
            player1Score: this.scoreLeft,
            player2Score: this.scoreRight,
          });
          if (this.onGameEnd) {
            this.onGameEnd(this.playerRightName);
          }
        } else {
          this.ballX = (this.baseWidth / 2) * this.scale;
          this.ballY = (this.baseHeight / 2) * this.scale;
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale;
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale;
          this.paddleLeftHeight = 80 * this.scale;
          this.paddleRightHeight = 80 * this.scale;
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
            player2Score: this.scoreRight,
          });
          if (this.onGameEnd) {
            this.onGameEnd(this.playerLeftName);
          }
        } else {
          this.ballX = (this.baseWidth / 2) * this.scale;
          this.ballY = (this.baseHeight / 2) * this.scale;
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale;
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale;
          this.paddleLeftHeight = 80 * this.scale;
          this.paddleRightHeight = 80 * this.scale;
        }
      }
    }

    // Draw power-ups and the ball
    this.drawPowerUps(this.ctx);
    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, 10 * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();

    // Display game over message with winner
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

    // Continue the animation loop
    this.animationFrameId = requestAnimationFrame(this.draw);
  }
}