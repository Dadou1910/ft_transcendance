import { PongGame } from "./game";
import { StatsManager } from "./stats";

// Defines interfaces for buildings and power-ups used in the game
interface Building {
  x: number
  y: number
  width: number
  height: number
  speed: number
  color: string
}

interface PowerUp {
  x: number
  y: number
  type: "speedBoost" | "paddleExtend"
  active: boolean
}

// Extends the base PongGame class to create a neon-themed version with additional features
export class NeonCityPong extends PongGame {
  // Array to store building objects for the background
  private buildings: Building[]
  // Array to store power-up objects
  private powerUps: PowerUp[]
  // Timer to control power-up spawning
  private powerUpTimer: number
  // Constant for power-up spawn interval
  private readonly POWER_UP_SPAWN_INTERVAL: number
  // Stores the animation frame ID for the game loop
  private animationFrameId: number | null = null
  // Back button element for navigation
  protected backButton: HTMLButtonElement
  // Heights for left and right paddles, which can change with power-ups
  private paddleLeftHeight: number = 80
  private paddleRightHeight: number = 80
  // Function to navigate to different routes
  protected navigate: (path: string) => void

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
    )
    this.navigate = navigate
    // Checks if canvas context is initialized
    if (!this.ctx) {
      console.error("Canvas context not initialized!")
      throw new Error("Failed to get 2D canvas context")
    }
    // Initializes buildings with position, size, speed, and color
    this.buildings = [
      { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, color: "#FF00FF" },
      { x: 400 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, color: "#00FFFF" },
      { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, color: "#FFFF00" },
    ]
    // Initializes empty power-ups array
    this.powerUps = []
    // Sets initial power-up timer
    this.powerUpTimer = 0
    // Sets power-up spawn interval
    this.POWER_UP_SPAWN_INTERVAL = 500

    // Creates and styles the back button
    this.backButton = document.createElement("button")
    this.backButton.textContent = "Back"
    this.backButton.style.display = "none"
    this.backButton.style.padding = "0.5rem 1rem"
    this.backButton.style.fontSize = "16px"
    this.backButton.style.cursor = "pointer"
    this.backButton.style.backgroundColor = "black"
    this.backButton.style.color = "white"
    this.backButton.style.border = "2px solid white"
    this.backButton.style.borderRadius = "0.375rem"
    this.backButton.style.transition = "background-color 0.3s"
    // Adds click event to navigate to welcome page
    this.backButton.addEventListener("click", () => {
      this.cleanup()
      this.navigate("/welcome")
    })
    // Adds hover effect for back button
    this.backButton.addEventListener("mouseover", () => {
      this.backButton.style.backgroundColor = "#333"
    })
    this.backButton.addEventListener("mouseout", () => {
      this.backButton.style.backgroundColor = "black"
    })

    // Appends buttons to game container or body if container is not found
    const gameContainer = document.getElementById("gameContainer")
    if (gameContainer) {
      const buttonContainer = document.createElement("div")
      buttonContainer.style.display = "flex"
      buttonContainer.style.gap = "1rem"
      buttonContainer.style.justifyContent = "center"
      buttonContainer.appendChild(this.restartButton)
      buttonContainer.appendChild(this.backButton)
      gameContainer.appendChild(buttonContainer)
      if (this.restartButton.parentElement !== buttonContainer) {
        this.restartButton.remove()
      }
    } else {
      console.error("Game container not found, appending buttons to body instead")
      document.body.appendChild(this.backButton)
      document.body.appendChild(this.restartButton)
    }

    // Logs initialization details
    console.log("NeonCityPong initialized:", {
      buildings: this.buildings,
      powerUps: this.powerUps,
      powerUpTimer: this.powerUpTimer,
      POWER_UP_SPAWN_INTERVAL: this.POWER_UP_SPAWN_INTERVAL,
    })

    // Binds methods to the class instance
    this.draw = this.draw.bind(this)
    this.drawBuildings = this.drawBuildings.bind(this)
    this.drawPowerUps = this.drawPowerUps.bind(this)
    this.spawnPowerUp = this.spawnPowerUp.bind(this)
    this.checkPowerUpCollision = this.checkPowerUpCollision.bind(this)
    this.checkBuildingCollision = this.checkBuildingCollision.bind(this)

    // Resizes canvas and starts animation
    this.resizeCanvas()
    window.addEventListener("resize", () => this.resizeCanvas())
    this.startAnimation()
  }

  // Resizes the canvas based on container size and maintains aspect ratio
  protected resizeCanvas(): void {
    const container = this.canvas.parentElement
    if (!container) return

    const maxWidth = container.clientWidth * 0.9
    const maxHeight = window.innerHeight * 0.7
    const aspectRatio = this.baseWidth / this.baseHeight

    let newWidth = Math.min(maxWidth, this.baseWidth)
    let newHeight = newWidth / aspectRatio

    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = newHeight * aspectRatio
    }

    // Updates scale and canvas dimensions
    this.scale = newWidth / this.baseWidth
    this.canvas.width = newWidth
    this.canvas.height = newHeight

    // Resets game elements positions and speeds
    this.ballX = (this.baseWidth / 2) * this.scale
    this.ballY = (this.baseHeight / 2) * this.scale
    this.paddleLeftY = (this.baseHeight / 2 - 40) * this.scale
    this.paddleRightY = (this.baseHeight / 2 - 40) * this.scale
    this.ballSpeedX = 5 * this.scale
    this.ballSpeedY = 3 * this.scale
    this.paddleSpeed = 5 * this.scale
    this.paddleLeftHeight = 80 * this.scale
    this.paddleRightHeight = 80 * this.scale

    // Reinitializes buildings with scaled values
    this.buildings = [
      { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, color: "#FF00FF" },
      { x: 400 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, color: "#00FFFF" },
      { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, color: "#FFFF00" },
    ]
    this.powerUps = []
    this.powerUpTimer = 0
  }

  // Starts the animation loop
  private startAnimation(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.draw)
    }
  }

  // Cleans up resources when the game is stopped
  public cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
      console.log("Animation loop stopped for NeonCityPong")
    }
    if (this.backButton) {
      this.backButton.remove()
    }
    window.removeEventListener("resize", () => this.resizeCanvas())
  }

  // Spawns a power-up at a random position near a paddle
  private spawnPowerUp(): void {
    const type = Math.random() > 0.5 ? "speedBoost" : "paddleExtend"
    const isLeftPaddle = Math.random() > 0.5
    const x = isLeftPaddle ? 20 * this.scale : (this.baseWidth - 20) * this.scale
    const y = Math.random() * (this.canvas.height - 20 * this.scale) + 10 * this.scale

    if (!this.powerUps) {
      console.warn("powerUps array is undefined, reinitializing...")
      this.powerUps = []
    }
    this.powerUps.push({ x, y, type, active: true })
  }

  // Draws the neon-themed background
  private drawNeonBackground(ctx: CanvasRenderingContext2D): void {
    console.log("Drawing neon background")
    const canvas = ctx.canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#1A1A2E"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draws a wavy ground effect
    ctx.fillStyle = "#0F0F1B"
    ctx.beginPath()
    ctx.moveTo(0, canvas.height)
    for (let x = 0; x <= canvas.width; x += 50 * this.scale) {
      const height = canvas.height - 50 * this.scale - Math.random() * 50 * this.scale
      ctx.lineTo(x, height)
    }
    ctx.lineTo(canvas.width, canvas.height)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
  }

  // Draws moving buildings in the background
  private drawBuildings(ctx: CanvasRenderingContext2D): void {
    console.log("Drawing buildings")
    if (!this.buildings) {
      console.warn("Buildings array is undefined, reinitializing...")
      this.buildings = [
        { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, color: "#FF00FF" },
        { x: 400 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, color: "#00FFFF" },
        { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, color: "#FFFF00" },
      ]
    }
    this.buildings.forEach(building => {
      ctx.save()
      building.y += building.speed
      if (building.y < -building.height) building.y = this.canvas.height
      if (building.y > this.canvas.height) building.y = -building.height

      ctx.fillStyle = building.color
      ctx.fillRect(building.x, building.y, building.width, building.height)
      ctx.strokeStyle = building.color
      ctx.lineWidth = 2 * this.scale
      ctx.strokeRect(building.x, building.y, building.width, building.height)
      ctx.restore()
    })
  }

  // Draws active power-ups on the canvas
  private drawPowerUps(ctx: CanvasRenderingContext2D): void {
    console.log("Drawing power-ups")
    if (!this.powerUps) {
      console.warn("powerUps array is undefined, reinitializing...")
      this.powerUps = []
    }
    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return
      ctx.fillStyle = powerUp.type === "speedBoost" ? "#FF00FF" : "#00FFFF"
      ctx.beginPath()
      ctx.arc(powerUp.x, powerUp.y, 10 * this.scale, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // Checks for collisions between power-ups and paddles
  private checkPowerUpCollision(): void {
    if (!this.powerUps) {
      console.warn("powerUps array is undefined, reinitializing...")
      this.powerUps = []
    }
    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return

      // Defines left paddle boundaries
      const leftPaddle = {
        x: 10 * this.scale,
        y: this.paddleLeftY,
        width: 20 * this.scale,
        height: this.paddleLeftHeight,
      }
      // Checks collision with left paddle
      if (
        powerUp.x + 10 * this.scale > leftPaddle.x &&
        powerUp.x - 10 * this.scale < leftPaddle.x + leftPaddle.width &&
        powerUp.y + 10 * this.scale > leftPaddle.y &&
        powerUp.y - 10 * this.scale < leftPaddle.y + leftPaddle.height
      ) {
        powerUp.active = false
        if (powerUp.type === "speedBoost") {
          this.ballSpeedX *= 1.5
          this.ballSpeedY *= 1.5
          console.log("Speed Boost activated for left paddle!")
        } else if (powerUp.type === "paddleExtend") {
          this.paddleLeftHeight = 120 * this.scale
          console.log("Left paddle extended!")
          setTimeout(() => {
            this.paddleLeftHeight = 80 * this.scale
            console.log("Left paddle reverted to normal size")
          }, 5000)
        }
      }

      // Defines right paddle boundaries
      const rightPaddle = {
        x: (this.baseWidth - 30) * this.scale,
        y: this.paddleRightY,
        width: 20 * this.scale,
        height: this.paddleRightHeight,
      }
      // Checks collision with right paddle
      if (
        powerUp.x + 10 * this.scale > rightPaddle.x &&
        powerUp.x - 10 * this.scale < rightPaddle.x + rightPaddle.width &&
        powerUp.y + 10 * this.scale > rightPaddle.y &&
        powerUp.y - 10 * this.scale < rightPaddle.y + rightPaddle.height
      ) {
        powerUp.active = false
        if (powerUp.type === "speedBoost") {
          this.ballSpeedX *= 1.5
          this.ballSpeedY *= 1.5
          console.log("Speed Boost activated for right paddle!")
        } else if (powerUp.type === "paddleExtend") {
          this.paddleRightHeight = 120 * this.scale
          console.log("Right paddle extended!")
          setTimeout(() => {
            this.paddleRightHeight = 80 * this.scale
            console.log("Right paddle reverted to normal size")
          }, 5000)
        }
      }
    })
  }

  // Checks for collisions between the ball and buildings
  private checkBuildingCollision(): void {
    if (!this.buildings) {
      console.warn("Buildings array is undefined, reinitializing...")
      this.buildings = [
        { x: 200 * this.scale, y: 100 * this.scale, width: 30 * this.scale, height: 80 * this.scale, speed: 1 * this.scale, color: "#FF00FF" },
        { x: 400 * this.scale, y: 300 * this.scale, width: 40 * this.scale, height: 120 * this.scale, speed: -1 * this.scale, color: "#00FFFF" },
        { x: 600 * this.scale, y: 200 * this.scale, width: 25 * this.scale, height: 100 * this.scale, speed: 1.5 * this.scale, color: "#FFFF00" },
      ]
    }
    this.buildings.forEach(building => {
      if (
        this.ballX + 10 * this.scale > building.x &&
        this.ballX - 10 * this.scale < building.x + building.width &&
        this.ballY + 10 * this.scale > building.y &&
        this.ballY - 10 * this.scale < building.y + building.height
      ) {
        // Determines which side of the building the ball hit
        const ballLeft = this.ballX - 10 * this.scale
        const ballRight = this.ballX + 10 * this.scale
        const ballTop = this.ballY - 10 * this.scale
        const ballBottom = this.ballY + 10 * this.scale

        const leftDiff = Math.abs(ballRight - building.x)
        const rightDiff = Math.abs(ballLeft - (building.x + building.width))
        const topDiff = Math.abs(ballBottom - building.y)
        const bottomDiff = Math.abs(ballTop - (building.y + building.height))

        const minDiff = Math.min(leftDiff, rightDiff, topDiff, bottomDiff)

        if (minDiff === leftDiff || minDiff === rightDiff) {
          this.ballSpeedX = -this.ballSpeedX
        } else {
          this.ballSpeedY = -this.ballSpeedY
        }
      }
    })
  }

  // Main draw loop for rendering the game
  protected draw(): void {
    if (!this.ctx) {
      console.error("Canvas context is null")
      return
    }

    // Draws the background and buildings
    this.drawNeonBackground(this.ctx)
    this.drawBuildings(this.ctx)

    // Draws paddles with dynamic height
    this.ctx.fillStyle = "white"
    this.ctx.fillRect(10 * this.scale, this.paddleLeftY, 20 * this.scale, this.paddleLeftHeight)
    this.ctx.fillRect((this.baseWidth - 30) * this.scale, this.paddleRightY, 20 * this.scale, this.paddleRightHeight)

    // Updates game state if the game is active
    if (this.gameStarted && !this.isPaused && !this.gameOver) {
      // Handles paddle movement based on key inputs
      if (this.keys.w && this.paddleLeftY > 0) this.paddleLeftY -= this.paddleSpeed
      if (this.keys.s && this.paddleLeftY < this.canvas.height - this.paddleLeftHeight) this.paddleLeftY += this.paddleSpeed
      if (this.keys.ArrowUp && this.paddleRightY > 0) this.paddleRightY -= this.paddleSpeed
      if (this.keys.ArrowDown && this.paddleRightY < this.canvas.height - this.paddleRightHeight) this.paddleRightY += this.paddleSpeed

      // Updates ball position
      this.ballX += this.ballSpeedX
      this.ballY += this.ballSpeedY

      // Bounces ball off top and bottom walls
      if (this.ballY <= 10 * this.scale || this.ballY >= this.canvas.height - 10 * this.scale) {
        this.ballSpeedY = -this.ballSpeedY
      }

      // Handles ball collision with left paddle
      if (
        this.ballX - 10 * this.scale >= 10 * this.scale &&
        this.ballX - 10 * this.scale <= 30 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + this.paddleLeftHeight
      ) {
        const ballCenterY = this.ballY
        const paddleCenterY = this.paddleLeftY + this.paddleLeftHeight / 2
        this.ballSpeedX = -this.ballSpeedX
        this.ballSpeedY += (ballCenterY - paddleCenterY) / (this.paddleLeftHeight / 2) * 2
      } else if (
        this.ballX + 10 * this.scale >= 10 * this.scale &&
        this.ballX + 10 * this.scale <= 30 * this.scale &&
        this.ballY >= this.paddleLeftY &&
        this.ballY <= this.paddleLeftY + this.paddleLeftHeight
      ) {
        const ballCenterY = this.ballY
        const paddleCenterY = this.paddleLeftY + this.paddleLeftHeight / 2
        this.ballSpeedX = -this.ballSpeedX
        this.ballSpeedY += (ballCenterY - paddleCenterY) / (this.paddleLeftHeight / 2) * 2
      } else if (
        this.ballX >= 10 * this.scale &&
        this.ballX <= 30 * this.scale &&
        (this.ballY - 10 * this.scale <= this.paddleLeftY + this.paddleLeftHeight && this.ballY + 10 * this.scale >= this.paddleLeftY)
      ) {
        this.ballSpeedY = -this.ballSpeedY
      }

      // Handles ball collision with right paddle
      if (
        this.ballX + 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX + 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + this.paddleRightHeight
      ) {
        const ballCenterY = this.ballY
        const paddleCenterY = this.paddleRightY + this.paddleRightHeight / 2
        this.ballSpeedX = -this.ballSpeedX
        this.ballSpeedY += (ballCenterY - paddleCenterY) / (this.paddleRightHeight / 2) * 2
      } else if (
        this.ballX - 10 * this.scale >= (this.baseWidth - 30) * this.scale &&
        this.ballX - 10 * this.scale <= (this.baseWidth - 10) * this.scale &&
        this.ballY >= this.paddleRightY &&
        this.ballY <= this.paddleRightY + this.paddleRightHeight
      ) {
        const ballCenterY = this.ballY
        const paddleCenterY = this.paddleRightY + this.paddleRightHeight / 2
        this.ballSpeedX = -this.ballSpeedX
        this.ballSpeedY += (ballCenterY - paddleCenterY) / (this.paddleRightHeight / 2) * 2
      } else if (
        this.ballX >= (this.baseWidth - 30) * this.scale &&
        this.ballX <= (this.baseWidth - 10) * this.scale &&
        (this.ballY - 10 * this.scale <= this.paddleRightY + this.paddleRightHeight && this.ballY + 10 * this.scale >= this.paddleRightY)
      ) {
        this.ballSpeedY = -this.ballSpeedY
      }

      // Checks for ball collisions with buildings
      this.checkBuildingCollision()

      // Manages power-up spawning and collisions
      this.powerUpTimer++
      if (this.powerUpTimer >= this.POWER_UP_SPAWN_INTERVAL) {
        this.spawnPowerUp()
        this.powerUpTimer = 0
      }
      this.checkPowerUpCollision()

      // Handles scoring and game over conditions
      if (this.ballX < 0) {
        this.scoreRight++
        this.scoreRightElement.textContent = this.scoreRight.toString()
        if (this.scoreRight >= 3) {
          this.gameOver = true
          this.restartButton.style.display = "block"
          this.backButton.style.display = "block"
          this.statsManager.recordMatch(this.playerRightName, this.playerLeftName, {
            player1Score: this.scoreLeft,
            player2Score: this.scoreRight
          })
          if (this.onGameEnd) {
            this.onGameEnd(this.playerRightName)
          }
        } else {
          this.ballX = (this.baseWidth / 2) * this.scale
          this.ballY = (this.baseHeight / 2) * this.scale
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale
        // adjust the ball speed based on slider
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale
          this.paddleLeftHeight = 80 * this.scale
          this.paddleRightHeight = 80 * this.scale
        }
      } else if (this.ballX > this.canvas.width) {
        this.scoreLeft++
        this.scoreLeftElement.textContent = this.scoreLeft.toString()
        if (this.scoreLeft >= 3) {
          this.gameOver = true
          this.restartButton.style.display = "block"
          this.backButton.style.display = "block"
          this.statsManager.recordMatch(this.playerLeftName, this.playerRightName, {
            player1Score: this.scoreLeft,
            player2Score: this.scoreRight
          })
          if (this.onGameEnd) {
            this.onGameEnd(this.playerLeftName)
          }
        } else {
          this.ballX = (this.baseWidth / 2) * this.scale
          this.ballY = (this.baseHeight / 2) * this.scale
          this.ballSpeedX = parseInt(this.speedSlider.value) * (this.ballSpeedX / Math.abs(this.ballSpeedX)) * this.scale
          this.ballSpeedY = parseInt(this.speedSlider.value) * (this.ballSpeedY / Math.abs(this.ballSpeedY)) * this.scale
          this.paddleLeftHeight = 80 * this.scale
          this.paddleRightHeight = 80 * this.scale
        }
      }
    }

    // Draws power-ups and the ball
    this.drawPowerUps(this.ctx)
    this.ctx.beginPath()
    this.ctx.arc(this.ballX, this.ballY, 10 * this.scale, 0, Math.PI * 2)
    this.ctx.fillStyle = "white"
    this.ctx.fill()

    // Displays game over message with winner
    if (this.gameOver) {
      this.ctx.font = `bold ${50 * this.scale}px 'Verdana', sans-serif`
      this.ctx.fillStyle = "white"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.shadowColor = "rgba(0, 0, 255, 0.5)"
      this.ctx.shadowBlur = 10 * this.scale
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
      this.ctx.fillText(
        this.scoreLeft >= 3 ? `${this.playerLeftName} Wins!` : `${this.playerRightName} Wins!`,
        this.canvas.width / 2,
        this.canvas.height / 2
      )
      this.ctx.shadowColor = "transparent"
      this.ctx.shadowBlur = 0
    }

    // Continues the animation loop
    this.animationFrameId = requestAnimationFrame(this.draw)
  }
}