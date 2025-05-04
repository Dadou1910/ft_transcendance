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
  radius: number;
  speed: number;
  side: "left" | "right";
}

interface Projectile {
  x: number;
  y: number;
  speed: number;
  side: "left" | "right";
}

export class MultiplayerSpaceBattle {
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
  public userEmail: string | null;
  public navigate: (path: string) => void;
  public onGameEnd?: (winnerName: string) => void;

  // Multiplayer state
  public ws: WebSocket | null = null;
  public isHost: boolean = false;
  public opponentName: string = "";
  public localPlayerReady: boolean = false;
  public remotePlayerReady: boolean = false;

  // Game state variables
  public stars: Star[];
  public leftSpaceship: Spaceship;
  public rightSpaceship: Spaceship;
  public targets: Target[];
  public projectiles: Projectile[];
  public gameStarted: boolean = false;
  public isPaused: boolean = false;
  public gameOver: boolean = false;
  public scoreLeft: number = 0;
  public scoreRight: number = 0;
  public playerLeftName: string;
  public playerRightName: string;
  public backgroundColor: string = "#d8a8b5";
  public targetSpawnTimer: number = 0;
  public readonly TARGET_SPAWN_INTERVAL: number = 200;
  public leftShootTimer: number = 0;
  public rightShootTimer: number = 0;
  public readonly SHOOT_INTERVAL: number = 20;
  public baseWidth: number = 800;
  public baseHeight: number = 400;
  public scale: number = 1;
  public lastTime: number = 0;
  public animationFrameId: number | null = null;
  public keys: Record<"a" | "d" | "ArrowLeft" | "ArrowRight", boolean> = {
    a: false,
    d: false,
    ArrowLeft: false,
    ArrowRight: false,
  };
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
    userEmail: string | null,
    navigate: (path: string) => void,
    matchId: string,
    isHost: boolean,
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
    this.userEmail = userEmail;
    this.navigate = navigate;
    this.isHost = isHost;
    this.onGameEnd = onGameEnd;

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

    this.setupEventListeners();
    this.resizeCanvas();
    this.draw(performance.now());

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
  }

  public setupWebSocket(ws: WebSocket, isHost: boolean, opponentName: string) {
    this.ws = ws;
    this.isHost = isHost;
    this.opponentName = opponentName;
    // All message handling is done in index.ts and forwarded to this class
  }

  // Host: handle input from guest
  public handlePaddleMessage(msg: any) {
    if (this.isHost && msg.type === "paddle" && msg.key in this.keys) {
      this.keys[msg.key as keyof typeof this.keys] = msg.pressed;
    }
  }

  // Guest: handle state updates from host
  public handleStateMessage(msg: any) {
    if (!this.isHost && msg.type === "state") {
      // Overwrite all relevant state
      this.leftSpaceship.x = msg.state.leftSpaceship.x;
      this.leftSpaceship.y = msg.state.leftSpaceship.y;
      this.rightSpaceship.x = msg.state.rightSpaceship.x;
      this.rightSpaceship.y = msg.state.rightSpaceship.y;
      this.targets = msg.state.targets;
      this.projectiles = msg.state.projectiles;
      this.scoreLeft = msg.state.scoreLeft;
      this.scoreRight = msg.state.scoreRight;
      this.gameOver = msg.state.gameOver;
      this.gameStarted = msg.state.gameStarted;
      this.draw(performance.now());
    }
  }

  // Call this after assignment to ensure the game loop starts when gameStarted is set to true
  public pollForGameStart() {
    const poll = () => {
      if (this.gameStarted && !this.gameLoopRunning) {
        console.log('========== DEBUG: GAME LOOP STARTED FROM POLLFORGAMESTART() ==========');
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
    console.log('========== DEBUG: GAME LOOP STARTED FROM STARTGAMELOOP() ==========');
    const loop = (timestamp: number) => {
      if (!this.gameStarted || this.gameOver) {
        console.log('========== DEBUG: GAME LOOP STOPPED FROM LOOP() - GAME NOT STARTED OR GAME OVER ==========');
        return;
      }
      this.updateGameState(timestamp);
      this.draw(timestamp);
      // Send state to guest
      if (this.ws && this.isHost) {
        this.ws.send(JSON.stringify({
          type: "state",
          state: {
            leftSpaceship: this.leftSpaceship,
            rightSpaceship: this.rightSpaceship,
            targets: this.targets,
            projectiles: this.projectiles,
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
    const frameTime = 1 / 60;
    const deltaTimeFactor = deltaTime / frameTime;

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
        speed: -5 * this.scale,
        side: "left",
      });
      this.leftShootTimer = 0;
    }
    this.rightShootTimer++;
    if (this.rightShootTimer >= this.SHOOT_INTERVAL) {
      this.projectiles.push({
        x: this.rightSpaceship.x,
        y: this.rightSpaceship.y - this.rightSpaceship.height / 2,
        speed: -5 * this.scale,
        side: "right",
      });
      this.rightShootTimer = 0;
    }

    // Update targets
    this.targets.forEach(target => {
      target.y += target.speed * deltaTimeFactor;
      if (target.y > this.canvas.height + target.radius) {
        target.y = -target.radius;
      }
    });

    // Update projectiles
    this.projectiles.forEach(projectile => {
      projectile.y += projectile.speed * deltaTimeFactor;
    });
    this.projectiles = this.projectiles.filter(projectile => projectile.y > -10 * this.scale);

    // Only host spawns targets
    if (this.isHost) {
      this.targetSpawnTimer++;
      if (this.targetSpawnTimer >= this.TARGET_SPAWN_INTERVAL) {
        this.spawnTarget();
        this.targetSpawnTimer = 0;
      }
    }

    // Check collisions
    this.checkCollisions();
  }

  private spawnTarget(): void {
    // Spawn one target in the left half
    this.targets.push({
      x: Math.random() * (this.canvas.width / 2 - 20 * this.scale) + 10 * this.scale,
      y: 10 * this.scale,
      radius: 10 * this.scale,
      speed: 1.3 * this.scale * this.getSpeedMultiplier(),
      side: "left",
    });
    // Spawn one target in the right half
    this.targets.push({
      x: Math.random() * (this.canvas.width / 2 - 20 * this.scale) + this.canvas.width / 2 + 10 * this.scale,
      y: 10 * this.scale,
      radius: 10 * this.scale,
      speed: 1.3 * this.scale * this.getSpeedMultiplier(),
      side: "right",
    });
  }

  private checkCollisions(): void {
    this.projectiles.forEach((projectile, pIndex) => {
      this.targets.forEach((target, tIndex) => {
        if (
          projectile.x > target.x - target.radius &&
          projectile.x < target.x + target.radius &&
          projectile.y > target.y - target.radius &&
          projectile.y < target.y + target.radius &&
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
          if (this.scoreLeft >= 10 || this.scoreRight >= 10) {
            const winnerName = this.scoreLeft >= 10 ? this.playerLeftName : this.playerRightName;
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'gameOver', winnerName }));
            }
            this.handleGameOver(winnerName);
          }
        }
      });
    });
  }

  private handleGameOver(winnerName: string): void {
    this.gameOver = true;
    this.targets = [];
    this.projectiles = [];
    this.restartButton.style.display = "none";
    if (this.isHost) {
      this.statsManager.recordMatch(winnerName, winnerName === this.playerLeftName ? this.playerRightName : this.playerLeftName, "Online Space Battle", {
      player1Score: this.scoreLeft,
      player2Score: this.scoreRight,
      sessionToken: localStorage.getItem("sessionToken")
    });
    }
    if (this.onGameEnd) {
      this.onGameEnd(winnerName);
    }
  }

  public draw(timestamp: number = performance.now()): void {
    // Calculate delta time for smooth animation
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const frameTime = 1 / 60;
    const deltaTimeFactor = deltaTime / frameTime;
  
    // Update score display every frame
    this.scoreLeftElement.textContent = this.scoreLeft.toString();
    this.scoreRightElement.textContent = this.scoreRight.toString();
  
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
  }

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

  private drawTargets(): void {
    this.ctx.fillStyle = "black";
    for (const target of this.targets) {
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawProjectiles(): void {
    this.ctx.fillStyle = "yellow";
    this.projectiles.forEach(projectile => {
      this.ctx.fillRect(projectile.x - 2 * this.scale, projectile.y - 5 * this.scale, 4 * this.scale, 10 * this.scale);
    });
  }

  private getSpeedMultiplier(): number {
    return parseInt(this.speedSlider.value) / 5;
  }

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

    // Keyboard controls (movement only)
    document.addEventListener("keydown", (e) => {
      if (e.key === " " && this.gameStarted) {
        this.isPaused = !this.isPaused;
      }
      if (["a", "d", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!this.isHost && this.ws) {
          this.ws.send(JSON.stringify({ type: "paddle", key: e.key, pressed: true }));
        } else {
          this.keys[e.key as "a" | "d" | "ArrowLeft" | "ArrowRight"] = true;
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      if (["a", "d", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!this.isHost && this.ws) {
          this.ws.send(JSON.stringify({ type: "paddle", key: e.key, pressed: false }));
        } else {
          this.keys[e.key as "a" | "d" | "ArrowLeft" | "ArrowRight"] = false;
        }
      }
    });

    // Resize handler
    window.addEventListener("resize", () => this.resizeCanvas());
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
        console.log('========== DEBUG: GAME LOOP STOPPED FROM CLEANUP() ==========');
    }
    this.gameLoopRunning = false;
    this.navigate("/");
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
      radius: target.radius * this.scale,
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
} 