import { StatsManager } from "./stats.js";

// Interfaces for game objects
interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface Spaceship {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  side: "left" | "right";
}

interface Projectile {
  x: number;
  y: number;
  speed: number;
  side: "left" | "right";
}

export class SpaceBattle {
  // Canvas and context for rendering
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  // UI elements for game settings and scores
  private speedSlider: HTMLInputElement;
  private backgroundColorSelect: HTMLSelectElement | null;
  private scoreLeftElement: HTMLSpanElement;
  private scoreRightElement: HTMLSpanElement;
  private restartButton: HTMLButtonElement;
  private settingsButton: HTMLButtonElement;
  private settingsMenu: HTMLDivElement;
  private settingsContainer: HTMLDivElement;
  // Manages game statistics
  private statsManager: StatsManager;
  // User email for settings persistence
  private userEmail: string | null;
  // Navigation callback
  private navigate: (path: string) => void;
  // Callback for game end (used in tournament mode)
  private onGameEnd?: (winnerName: string) => void;

  // Game objects
  private stars: Star[];
  private leftSpaceship: Spaceship;
  private rightSpaceship: Spaceship;
  private targets: Target[];
  private projectiles: Projectile[];

  // Game state variables
  private gameStarted: boolean = false;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private scoreLeft: number = 0;
  private scoreRight: number = 0;
  private playerLeftName: string;
  private playerRightName: string;
  private backgroundColor: string = "#d8a8b5";
  private targetSpawnTimer: number = 0;
  private readonly TARGET_SPAWN_INTERVAL: number = 100;
  private leftShootTimer: number = 0;
  private rightShootTimer: number = 0;
  private readonly SHOOT_INTERVAL: number = 20; // Controls how often spaceships shoot (lower = faster)

  // Canvas dimensions and scaling
  private baseWidth: number = 800;
  private baseHeight: number = 400;
  private scale: number = 1;

  // Timing for delta-time calculation
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  // Keyboard state for movement only
  private keys: Record<"a" | "d" | "ArrowLeft" | "ArrowRight", boolean> = {
    a: false,
    d: false,
    ArrowLeft: false,
    ArrowRight: false,
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
    settingsContainerId: string,
    statsManager: StatsManager,
    userEmail: string | null,
    navigate: (path: string) => void,
    onGameEnd?: (winnerName: string) => void
  ) {
    // Initialize UI elements
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
    this.navigate = navigate;
    this.onGameEnd = onGameEnd;

    // Ensure restartButton is in buttonContainer and initially visible
    const buttonContainer = document.getElementById("buttonContainer");
    if (buttonContainer && this.restartButton.parentElement !== buttonContainer) {
      buttonContainer.appendChild(this.restartButton);
    }
    this.restartButton.style.display = "block";

    // Initialize game objects
    this.stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * this.baseWidth,
      y: Math.random() * this.baseHeight,
      speed: Math.random() * 0.5 + 0.5,
      size: Math.random() * 2 + 1,
    }));

    this.leftSpaceship = {
      x: this.baseWidth / 4,
      y: this.baseHeight - 30,
      width: 30,
      height: 20,
    };
    this.rightSpaceship = {
      x: (this.baseWidth * 3) / 4,
      y: this.baseHeight - 30,
      width: 30,
      height: 20,
    };

    this.targets = [];
    this.projectiles = [];

    // Set up event listeners and start rendering
    this.setupEventListeners();
    this.resizeCanvas();
    this.draw();
  }

  // Computes the speed multiplier based on the speed slider
  private getSpeedMultiplier(): number {
    return parseInt(this.speedSlider.value) / 5; // Default slider value of 5 gives multiplier of 1
  }

  // Resizes canvas based on browser window size and maintains aspect ratio
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

    // Update positions and sizes with scale
    this.leftSpaceship.x = (this.baseWidth / 4) * this.scale;
    this.leftSpaceship.y = (this.baseHeight - 30) * this.scale;
    this.leftSpaceship.width = 30 * this.scale;
    this.leftSpaceship.height = 20 * this.scale;
    this.rightSpaceship.x = (this.baseWidth * 3 / 4) * this.scale;
    this.rightSpaceship.y = (this.baseHeight - 30) * this.scale;
    this.rightSpaceship.width = 30 * this.scale;
    this.rightSpaceship.height = 20 * this.scale;

    this.stars = this.stars.map(star => ({
      x: star.x * this.scale,
      y: star.y * this.scale,
      speed: star.speed * this.scale,
      size: star.size,
    }));

    this.targets = this.targets.map(target => ({
      ...target,
      x: target.side === "left"
        ? target.x * this.scale
        : (target.x - this.baseWidth / 2) * this.scale + this.canvas.width / 2,
      y: target.y * this.scale,
      width: target.width * this.scale,
      height: target.height * this.scale,
      speed: target.speed * this.scale,
    }));

    this.projectiles = this.projectiles.map(projectile => ({
      ...projectile,
      x: projectile.side === "left"
        ? projectile.x * this.scale
        : (projectile.x - this.baseWidth / 2) * this.scale + this.canvas.width / 2,
      y: projectile.y * this.scale,
      speed: projectile.speed * this.scale,
    }));
  }

  // Sets up event listeners for game controls and settings
  private setupEventListeners(): void {
    // Speed slider
    this.speedSlider.addEventListener("input", () => {
      if (this.userEmail) {
        this.statsManager.setUserSettings(this.userEmail, { ballSpeed: parseInt(this.speedSlider.value) });
      }
    });

    // Background color selector
    if (this.backgroundColorSelect) {
      this.backgroundColor = this.backgroundColorSelect.value || "#d8a8b5";
      this.backgroundColorSelect.addEventListener("change", (e) => {
        this.backgroundColor = (e.target as HTMLSelectElement).value;
        if (this.userEmail) {
          this.statsManager.setUserSettings(this.userEmail, { backgroundColor: this.backgroundColor });
        }
      });
    } else {
      console.warn("Background color select element not found");
    }

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
        this.gameStarted = true;
        this.isPaused = false;
        this.gameOver = false;
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.scoreLeftElement.textContent = "0";
        this.scoreRightElement.textContent = "0";
        this.targets = [];
        this.projectiles = [];
        this.targetSpawnTimer = 0;
        this.leftShootTimer = 0;
        this.rightShootTimer = 0;
        this.restartButton.style.display = "none";
      } else {
        // Restart the game
        this.gameStarted = true;
        this.isPaused = false;
        this.gameOver = false;
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.scoreLeftElement.textContent = "0";
        this.scoreRightElement.textContent = "0";
        this.targets = [];
        this.projectiles = [];
        this.targetSpawnTimer = 0;
        this.leftShootTimer = 0;
        this.rightShootTimer = 0;
        this.restartButton.style.display = "none";
      }
    });

    // Back button
    const backButton = document.getElementById("backButton") as HTMLButtonElement;
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.cleanup();
        this.navigate("/welcome");
      });
    } else {
      console.error("Back button not found!");
    }

    // Keyboard controls (movement only)
    document.addEventListener("keydown", (e) => {
      if (e.key === " " && this.gameStarted) {
        this.isPaused = !this.isPaused;
      }
      if (["a", "d", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        this.keys[e.key as "a" | "d" | "ArrowLeft" | "ArrowRight"] = true;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (["a", "d", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        this.keys[e.key as "a" | "d" | "ArrowLeft" | "ArrowRight"] = false;
      }
    });

    // Resize handler
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  // Cleans up event listeners
  public cleanup(): void {
    window.removeEventListener("resize", () => this.resizeCanvas());
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Spawns a target in either half
  private spawnTarget(): void {
    // Spawn one target in the left half
    this.targets.push({
      x: Math.random() * (this.canvas.width / 2 - 20 * this.scale) + 10 * this.scale,
      y: 10 * this.scale,
      width: 20 * this.scale,
      height: 20 * this.scale,
      speed: 2 * this.scale * this.getSpeedMultiplier(),
      side: "left",
    });
    // Spawn one target in the right half
    this.targets.push({
      x: Math.random() * (this.canvas.width / 2 - 20 * this.scale) + this.canvas.width / 2 + 10 * this.scale,
      y: 10 * this.scale,
      width: 20 * this.scale,
      height: 20 * this.scale,
      speed: 2 * this.scale * this.getSpeedMultiplier(),
      side: "right",
    });
  }

  // Draws the space-themed background with a dividing line
  private drawBackground(): void {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 2 * this.scale;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
  }

  // Draws moving stars
  private drawStars(): void {
    this.ctx.fillStyle = "white";
    this.stars.forEach(star => {
      star.y += star.speed * this.scale;
      if (star.y > this.canvas.height) star.y = -star.size;
      this.ctx.beginPath();
      this.ctx.arc(star.x * this.scale, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // Draws spaceships
  private drawSpaceships(): void {
    this.ctx.fillStyle = "cyan";
    this.ctx.fillRect(
      this.leftSpaceship.x - this.leftSpaceship.width / 2,
      this.leftSpaceship.y - this.leftSpaceship.height / 2,
      this.leftSpaceship.width,
      this.leftSpaceship.height
    );
    this.ctx.fillStyle = "magenta";
    this.ctx.fillRect(
      this.rightSpaceship.x - this.rightSpaceship.width / 2,
      this.rightSpaceship.y - this.rightSpaceship.height / 2,
      this.rightSpaceship.width,
      this.rightSpaceship.height
    );
  }

  // Draws targets (now black)
  private drawTargets(): void {
    this.ctx.fillStyle = "black";
    this.targets.forEach(target => {
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // Draws projectiles
  private drawProjectiles(): void {
    this.ctx.fillStyle = "yellow";
    this.projectiles.forEach(projectile => {
      this.ctx.fillRect(projectile.x - 2 * this.scale, projectile.y - 5 * this.scale, 4 * this.scale, 10 * this.scale);
    });
  }

  // Checks for projectile-target collisions
  private checkCollisions(): void {
    this.projectiles.forEach((projectile, pIndex) => {
      this.targets.forEach((target, tIndex) => {
        if (
          projectile.x > target.x - target.width / 2 &&
          projectile.x < target.x + target.width / 2 &&
          projectile.y > target.y - target.height / 2 &&
          projectile.y < target.y + target.height / 2 &&
          projectile.side === target.side
        ) {
          this.projectiles.splice(pIndex, 1);
          this.targets.splice(tIndex, 1);
          if (projectile.side === "left") {
            this.scoreLeft++;
            this.scoreLeftElement.textContent = this.scoreLeft.toString();
          } else {
            this.scoreRight++;
            this.scoreRightElement.textContent = this.scoreRight.toString();
          }
          if (this.scoreLeft >= 10) {
            this.handleGameOver(this.playerLeftName);
          } else if (this.scoreRight >= 10) {
            this.handleGameOver(this.playerRightName);
          }
        }
      });
    });
  }

  // Handles game over logic
  private handleGameOver(winnerName: string): void {
    this.gameOver = true;
    this.targets = [];
    this.projectiles = [];
    this.restartButton.style.display = "block";
    const backButton = document.getElementById("backButton") as HTMLButtonElement;
    if (backButton) backButton.style.display = "block";
    this.statsManager.recordMatch(winnerName, winnerName === this.playerLeftName ? this.playerRightName : this.playerLeftName, "Space Battle", {
        player1Score: this.scoreLeft,
        player2Score: this.scoreRight,
    });
    if (this.onGameEnd) {
      this.onGameEnd(winnerName);
    }
  }

  // Main draw loop
  private draw(timestamp: number = performance.now()): void {
    // Calculate delta time for smooth animation
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const frameTime = 1 / 60;
    const deltaTimeFactor = deltaTime / frameTime;

    // Clear canvas and draw background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawStars();
    this.drawSpaceships();
    this.drawTargets();
    this.drawProjectiles();

    // Show "Press Start" message if game hasn't started
    if (!this.gameStarted && !this.gameOver) {
      this.ctx.font = `bold ${30 * this.scale}px 'Verdana', sans-serif`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("Press Start", this.canvas.width / 2, this.canvas.height / 2);
    }

    // Update game state if started, not paused, and not over
    if (this.gameStarted && !this.isPaused && !this.gameOver) {
      // Move spaceships
      const spaceshipSpeed = 5 * this.scale * deltaTimeFactor;
      if (this.keys.a && this.leftSpaceship.x - this.leftSpaceship.width / 2 > 0) {
        this.leftSpaceship.x -= spaceshipSpeed;
      }
      if (this.keys.d && this.leftSpaceship.x + this.leftSpaceship.width / 2 < this.canvas.width / 2) {
        this.leftSpaceship.x += spaceshipSpeed;
      }
      if (this.keys.ArrowLeft && this.rightSpaceship.x - this.rightSpaceship.width / 2 > this.canvas.width / 2) {
        this.rightSpaceship.x -= spaceshipSpeed;
      }
      if (this.keys.ArrowRight && this.rightSpaceship.x + this.rightSpaceship.width / 2 < this.canvas.width) {
        this.rightSpaceship.x += spaceshipSpeed;
      }

      // Automatically shoot projectiles
      this.leftShootTimer++;
      if (this.leftShootTimer >= this.SHOOT_INTERVAL) {
        this.projectiles.push({
          x: this.leftSpaceship.x,
          y: this.leftSpaceship.y - this.leftSpaceship.height / 2,
          speed: -10 * this.scale,
          side: "left",
        });
        this.leftShootTimer = 0;
      }
      this.rightShootTimer++;
      if (this.rightShootTimer >= this.SHOOT_INTERVAL) {
        this.projectiles.push({
          x: this.rightSpaceship.x,
          y: this.rightSpaceship.y - this.rightSpaceship.height / 2,
          speed: -10 * this.scale,
          side: "right",
        });
        this.rightShootTimer = 0;
      }

      // Update targets
      this.targets.forEach(target => {
        target.y += target.speed * deltaTimeFactor;
      });
      this.targets = this.targets.filter(target => target.y < this.canvas.height + target.height / 2);

      // Update projectiles
      this.projectiles.forEach(projectile => {
        projectile.y += projectile.speed * deltaTimeFactor;
      });
      this.projectiles = this.projectiles.filter(projectile => projectile.y > -10 * this.scale);

      // Spawn targets
      this.targetSpawnTimer++;
      if (this.targetSpawnTimer >= this.TARGET_SPAWN_INTERVAL) {
        this.spawnTarget();
        this.targetSpawnTimer = 0;
      }

      // Check collisions
      this.checkCollisions();
    }

    // Display game over message
    if (this.gameOver) {
      this.ctx.font = `bold ${50 * this.scale}px 'Verdana', sans-serif`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.shadowColor = "rgba(0, 0, 255, 0.5)";
      this.ctx.shadowBlur = 10 * this.scale;
      this.ctx.fillText(
        this.scoreLeft >= 10 ? `${this.playerLeftName} Wins!` : `${this.playerRightName} Wins!`,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.ctx.shadowColor = "transparent";
      this.ctx.shadowBlur = 0;
    }

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(this.draw.bind(this));
  }
}