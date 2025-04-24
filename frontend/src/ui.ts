// Manages UI rendering and setup for the Pong Transcendence game
// Includes welcome pages, game view, forms, and tournament end screen

// ------------------------------------------
// Section 1: Welcome Page (Pre-Login)
// ------------------------------------------

// Renders the pre-login welcome page with register and login buttons
export function renderWelcomePage(onRegister: () => void, onLogin: () => void): string {
  return `
    <div class="full-screen-container">
      <div class="welcome-container">
        <h1 class="neon-title">
          Pong Transcendence
        </h1>
        <p class="welcome-subtitle">
          Challenge Your Friends in a Neon Pong Arena
        </p>
        <div class="flex flex-col gap-4">
          <button id="registerButton" class="welcome-button">
            Register
          </button>
          <button id="loginButton" class="welcome-button">
            Login
          </button>
        </div>
      </div>
    </div>
  `;
}

// Sets up event listeners for the welcome page buttons
export function setupWelcomePage(onRegister: () => void, onLogin: () => void) {
  const registerButton = document.getElementById("registerButton") as HTMLButtonElement;
  const loginButton = document.getElementById("loginButton") as HTMLButtonElement;
  registerButton.addEventListener("click", onRegister);
  loginButton.addEventListener("click", onLogin);
}

// ------------------------------------------
// Section 2: Welcome Page (Post-Login)
// ------------------------------------------
// Renders the post-login welcome page with user info and game options
export function renderLoggedInWelcomePage(
  username: string,
  email: string,
  avatarUrl?: string
): string {
  const avatarSrc = avatarUrl || '';
  return `
    <div class="logged-in-container">
      <button id="toggleSidebarButton" class="toggle-button">
        Menu
      </button>
      <div id="sidebar" class="sidebar">
        <img
          src="${avatarSrc}"
          class="avatar"
          ${avatarSrc ? '' : 'style="background-color: black;"'}
        />
        <h2 class="sidebar-username">${username}</h2>
        <p class="sidebar-email">${email}</p>
        <div class="sidebar-links">
          <a class="sidebar-link">Settings</a>
          <a class="sidebar-link">Leaderboard</a>
          <a class="sidebar-link">Profile</a>
          <a id="logoutLink" class="sidebar-link">Logout</a>
        </div>
      </div>
      <div class="main-content">
        <h1 class="main-title">
          Welcome, ${username}!
        </h1>
        <div class="flex flex-col gap-6">
          <button id="playTournamentButton" class="action-button">
            Play Tournament
          </button>
          <div class="flex flex-col gap-2">
            <select id="gameModeSelect" class="action-button p-2 rounded-md">
              <option value="standard">Standard Pong</option>
              <option value="neonCity">Neon City Pong</option>
              <option value="ai">AI Pong</option>
              <option value="spaceBattle">Space Battle</option>
            </select>
            <button id="playMatchButton" class="action-button">
              Play Match
            </button>
          </div>
          <button id="playMultiplayerButton" class="action-button">
            Play Multiplayer
          </button>
        </div>
        <div class="about-pong">
          <h2 class="about-title">
            About Pong
          </h2>
          <p class="mb-4">
            Pong is a classic two-player game where each player controls a paddle to hit a ball back and forth. Use <strong>W</strong> and <strong>S</strong> keys for the left paddle, and <strong>Arrow Up</strong> and <strong>Arrow Down</strong> for the right. Score a point when your opponent misses the ball. The first to 3 points wins the match!
          </p>
          <p>
            Originating in 1972, Pong was created by Atari and is considered one of the first video games, sparking the arcade gaming revolution. Its simple yet addictive gameplay has made it a timeless icon in gaming history.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Sets up event listeners for the post-login welcome page
export function setupLoggedInWelcomePage(
  onLogout: () => void,
  username: string,
  onPlayMatch: () => void,
  onPlayTournament?: () => void,
  onPlayMultiplayer?: () => void // Add callback for multiplayer
) {
  const logoutLink = document.getElementById("logoutLink") as HTMLAnchorElement;
  const playMatchButton = document.getElementById("playMatchButton") as HTMLButtonElement;
  const playTournamentButton = document.getElementById("playTournamentButton") as HTMLButtonElement;
  const playMultiplayerButton = document.getElementById("playMultiplayerButton") as HTMLButtonElement;
  const gameModeSelect = document.getElementById("gameModeSelect") as HTMLSelectElement;
  const toggleSidebarButton = document.getElementById("toggleSidebarButton") as HTMLButtonElement;
  const sidebar = document.getElementById("sidebar") as HTMLDivElement;

  // Attach logout event listener
  if (logoutLink) {
    console.log("Attaching listener to logout link");
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Logout link clicked, calling onLogout");
      try {
        onLogout();
      } catch (error) {
        console.error("Error in onLogout:", error);
      }
    });
  } else {
    console.error("Logout link not found!");
  }

  // Attach play match event listener
  if (playMatchButton && gameModeSelect) {
    console.log("Attaching listener to play match button");
    playMatchButton.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Play Match button clicked, calling onPlayMatch with mode:", gameModeSelect.value);
      try {
        onPlayMatch();
      } catch (error) {
        console.error("Error in onPlayMatch:", error);
      }
    });
  } else {
    console.error("Play Match button or gameModeSelect not found!");
  }

  // Attach play tournament event listener
  if (playTournamentButton && onPlayTournament) {
    console.log("Attaching listener to play tournament button");
    playTournamentButton.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Play Tournament button clicked, calling onPlayTournament");
      try {
        onPlayTournament();
      } catch (error) {
        console.error("Error in onPlayTournament:", error);
      }
    });
  } else {
    console.error("Play Tournament button or callback not found!");
  }

  // Attach play multiplayer event listener
  if (playMultiplayerButton && onPlayMultiplayer) {
    console.log("Attaching listener to play multiplayer button");
    playMultiplayerButton.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Play Multiplayer button clicked, calling onPlayMultiplayer");
      try {
        onPlayMultiplayer();
      } catch (error) {
        console.error("Error in onPlayMultiplayer:", error);
      }
    });
  } else {
    console.error("Play Multiplayer button or callback not found!");
  }

  // Attach sidebar toggle event listener
  if (toggleSidebarButton && sidebar) {
    console.log("Attaching listener to toggle sidebar button");
    toggleSidebarButton.addEventListener("click", () => {
      sidebar.classList.toggle("visible");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target as Node;
      if (
        sidebar.classList.contains("visible") &&
        !sidebar.contains(target) &&
        !toggleSidebarButton.contains(target)
      ) {
        sidebar.classList.remove("visible");
      }
    });
  } else {
    console.error("Toggle sidebar button or sidebar not found!");
  }
}

// ------------------------------------------
// Section 3: Name Entry Form (Tournament)
// ------------------------------------------
// Renders the form for entering tournament player names
export function renderNameEntryForm(onSubmit: (player1: string, player2: string, player3: string, player4: string) => void): string {
  return `
    <div class="full-screen-container">
      <form id="nameEntryForm" class="name-entry-form">
        <h2 class="form-title">
          Enter Player Names
        </h2>
        <input
          id="player1Input"
          type="text"
          placeholder="Player 1 Name"
          class="form-input"
          required
        />
        <input
          id="player2Input"
          type="text"
          placeholder="Player 2 Name"
          class="form-input"
          required
        />
        <input
          id="player3Input"
          type="text"
          placeholder="Player 3 Name"
          class="form-input"
          required
        />
        <input
          id="player4Input"
          type="text"
          placeholder="Player 4 Name"
          class="form-input"
          required
        />
        <button type="submit" class="form-button">
          Start Tournament
        </button>
      </form>
    </div>
  `;
}

// Sets up the tournament name entry form with validation
export function setupNameForm(onSubmit: (player1: string, player2: string, player3: string, player4: string) => void) {
  const form = document.getElementById("nameEntryForm") as HTMLFormElement;
  const player1Input = document.getElementById("player1Input") as HTMLInputElement;
  const player2Input = document.getElementById("player2Input") as HTMLInputElement;
  const player3Input = document.getElementById("player3Input") as HTMLInputElement;
  const player4Input = document.getElementById("player4Input") as HTMLInputElement;

  // Validate and submit player names
  if (form && player1Input && player2Input && player3Input && player4Input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const player1 = player1Input.value.trim();
      const player2 = player2Input.value.trim();
      const player3 = player3Input.value.trim();
      const player4 = player4Input.value.trim();

      // Ensure exactly four non-empty names
      const enteredNames = [player1, player2, player3, player4].filter(name => name !== '');
      if (enteredNames.length === 4) {
        onSubmit(player1, player2, player3, player4);
      } else {
        alert("Please enter names for exactly four players.");
      }
    });
  } else {
    console.error("Name entry form elements not found!");
  }
}

// ------------------------------------------
// Section 4: Game Screen
// ------------------------------------------
// Renders the game view with player names and optional round number
export function renderGameView(playerLeftName: string, playerRightName: string, roundNumber?: number, isMultiplayer: boolean = false): string {
  const leftDisplayName = playerLeftName.trim() || "Player 1";
  const rightDisplayName = playerRightName.trim() || "Player 2";
  return `
    <div id="gameContainer" class="game-container">
      ${roundNumber !== undefined ? `
        <div class="tournament-round">
          Tournament ${roundNumber === 0 ? 'Semifinals' : 'Final'}
        </div>
      ` : ''}
      <div class="score-container">
        <span><span id="playerLeftNameDisplay">${leftDisplayName}</span>: <span id="scoreLeft">0</span></span>
        <span><span id="playerRightNameDisplay">${rightDisplayName}</span>: <span id="scoreRight">0</span></span>
      </div>
      <div class="game-area flex gap-5 items-start relative">
        <canvas id="pongCanvas" width="800" height="400" class="pong-canvas"></canvas>
        ${isMultiplayer ? `
          <div id="waitingMessage" class="waiting-message absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <p class="text-white text-2xl">Waiting for opponent...</p>
          </div>
        ` : ''}
        <div id="settingsContainer" class="relative w-10">
          <button id="settingsButton" class="settings-button"></button>
          <div id="settingsMenu" class="settings-menu">
            <div class="flex items-center gap-2">
              <label for="backgroundColorSelect" class="text-white whitespace-nowrap">Color:</label>
              <select id="backgroundColorSelect" class="color-select">
                <option value="#d8a8b5">Pastel Pink</option>
                <option value="#b8b8d8">Soft Lavender</option>
                <option value="#a8c8b5">Mint Green</option>
                <option value="#a9c3d9">Baby Blue</option>
                <option value="#d9c9a8">Cream</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label for="speedSlider" class="text-white">Target Speed:</label>
              <input type="range" id="speedSlider" min="1" max="10" value="5" class="speed-slider">
            </div>
          </div>
        </div>
        <div id="buttonContainer" class="button-container">
          <button id="restartButton" class="game-control-button">Start</button>
          <button id="backButton" class="game-control-button" style="display: none;">Back</button>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------
// Section 5: Registration Form
// ------------------------------------------
// Renders the registration form with enhanced password validation warning
export function renderRegistrationForm(onSubmit: (username: string, email: string, password: string, avatar?: File) => void): string {
  return `
    <div class="full-screen-container">
      <div id="registrationFormContainer" class="registration-form-container">
        <h2 class="form-title-small">
          Create Your Account
        </h2>
        <form id="registrationForm" class="flex flex-col gap-4">
          <div>
            <label for="username" class="block text-white text-lg">Username:</label>
            <input type="text" id="username" class="form-input" required>
            <p id="usernameError" class="error-message">Username must be 3-20 characters, alphanumeric only.</p>
          </div>
          <div>
            <label for="email" class="block text-white text-lg">Email:</label>
            <input type="email" id="email" class="form-input" required>
            <p id="emailError" class="error-message">Please enter a valid email address.</p>
          </div>
          <div>
            <label for="password" class="block text-white text-lg">Password:</label>
            <input type="password" id="password" class="form-input" required>
            <p id="passwordError" class="error-message">Password must be at least 8 characters, including a number and a special character.</p>
          </div>
          <div>
            <label for="avatar" class="block text-white text-lg">Avatar (Optional):</label>
            <input type="file" id="avatar" accept="image/*" class="form-input">
          </div>
          <button type="submit" class="form-button">Register</button>
        </form>
      </div>
    </div>
  `;
}

// Sets up the registration form with validation
export function setupRegistrationForm(onSubmit: (username: string, email: string, password: string, avatar?: File) => void) {
  const form = document.getElementById("registrationForm") as HTMLFormElement;
  if (!form) {
    console.error("Registration form not found!");
    return;
  }
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const avatarInput = document.getElementById("avatar") as HTMLInputElement;
  const usernameError = document.getElementById("usernameError") as HTMLParagraphElement;
  const emailError = document.getElementById("emailError") as HTMLParagraphElement;
  const passwordError = document.getElementById("passwordError") as HTMLParagraphElement;

  // Handle form submission with validation
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Registration form submitted");
    let isValid = true;

    // Validate username: 3-20 characters, alphanumeric
    const username = usernameInput.value.trim();
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!usernameRegex.test(username)) {
      usernameError.classList.add("visible");
      isValid = false;
    } else {
      usernameError.classList.remove("visible");
    }

    // Validate email
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailError.classList.add("visible");
      isValid = false;
    } else {
      emailError.classList.remove("visible");
    }

    // Validate password: 8+ characters, 1 number, 1 special character
    const password = passwordInput.value;
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      passwordError.classList.add("visible");
      isValid = false;
    } else {
      passwordError.classList.remove("visible");
    }

    // Optional avatar
    const avatar = avatarInput.files?.[0];

    // Submit if valid
    if (isValid) {
      console.log("Registration validation passed, calling onSubmit");
      try {
        onSubmit(username, email, password, avatar);
      } catch (error) {
        console.error("Error in registration onSubmit:", error);
      }
    } else {
      console.log("Registration validation failed");
    }
  });
}

// ------------------------------------------
// Section 6: Login Form
// ------------------------------------------
// Renders the login form
export function renderLoginForm(onSubmit: (email: string, password: string) => void, onRegister: () => void): string {
  return `
    <div class="full-screen-container">
      <div id="loginFormContainer" class="login-form-container">
        <h2 class="form-title-small">
          Login to Your Account
        </h2>
        <form id="loginForm" class="flex flex-col gap-4" autocomplete="off">
          <div>
            <label for="email" class="block text-white text-lg">Email:</label>
            <input type="email" id="email" class="form-input" required autocomplete="off">
            <p id="emailError" class="error-message">Please enter a valid email address.</p>
          </div>
          <div>
            <label for="password" class="block text-white text-lg">Password:</label>
            <input type="password" id="password" class="form-input" required autocomplete="off">
            <p id="passwordError" class="error-message">Password is required.</p>
          </div>
          <button type="submit" class="form-button">Login</button>
        </form>
        <p class="text-white mt-4">
          Don't have an account? 
          <a id="registerLink" class="form-link" href="/register">Create one here</a>.
        </p>
      </div>
    </div>
  `;
}

// Sets up the login form with validation and register link
export function setupLoginForm(onSubmit: (email: string, password: string) => void, onRegister: () => void) {
  const form = document.getElementById("loginForm") as HTMLFormElement;
  let registerLink = document.getElementById("registerLink") as HTMLAnchorElement;

  if (!form) {
    console.error("Login form not found!");
    return;
  }

  // Function to attach register link listener
  function attachRegisterLinkListener(link: HTMLAnchorElement, onRegisterCallback: () => void) {
    console.log("Attaching listener to register link");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Register link clicked, calling onRegister");
      try {
        onRegisterCallback();
      } catch (error) {
        console.error("Error in onRegister:", error);
      }
    });
  }

  // Handle register link with delay if not found
  if (!registerLink) {
    console.error("Register link not found! Attempting to find after delay...");
    setTimeout(() => {
      registerLink = document.getElementById("registerLink") as HTMLAnchorElement;
      if (!registerLink) {
        console.error("Register link still not found after delay!");
        return;
      }
      attachRegisterLinkListener(registerLink, onRegister);
    }, 100);
  } else {
    attachRegisterLinkListener(registerLink, onRegister);
  }

  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const emailError = document.getElementById("emailError") as HTMLParagraphElement;
  const passwordError = document.getElementById("passwordError") as HTMLParagraphElement;

  // Handle form submission with validation
  form.addEventListener("submit", (e) => {
    console.log("Login form submit event triggered");
    e.preventDefault();

    let isValid = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Email validation failed:", email);
      emailError.classList.remove("hidden");
      isValid = false;
    } else {
      emailError.classList.add("hidden");
    }

    // Validate password: non-empty
    if (!password) {
      console.log("Password validation failed: empty");
      passwordError.classList.remove("hidden");
      isValid = false;
    } else {
      passwordError.classList.add("hidden");
    }

    // Submit if valid
    if (isValid) {
      console.log("Form validation passed, calling onSubmit with:", { email, password });
      try {
        onSubmit(email, password);
      } catch (error) {
        console.error("Error during login onSubmit:", error);
      }
    } else {
      console.log("Form validation failed");
    }
  });
}

// ------------------------------------------
// Section 7: Tournament End Screen
// ------------------------------------------
// Renders the tournament end screen with the winner's name
export function renderTournamentEnd(winnerName: string): string {
  return `
    <div class="tournament-end-container">
      <h1 class="tournament-winner">
        ${winnerName} Wins!
      </h1>
      <div class="flex gap-4">
        <button id="startAgainButton" class="tournament-end-button">
          Start Again
        </button>
        <button id="backButton" class="tournament-end-button">
          Back
        </button>
      </div>
    </div>
  `;
}

// Sets up event listeners for the tournament end screen buttons
export function setupTournamentEnd(onStartAgain: () => void, onBack: () => void) {
  const startAgainButton = document.getElementById("startAgainButton") as HTMLButtonElement;
  const backButton = document.getElementById("backButton") as HTMLButtonElement;

  // Attach start again button listener
  if (startAgainButton) {
    startAgainButton.addEventListener("click", (e) => {
      e.preventDefault();
      onStartAgain();
    });
  } else {
    console.error("Start Again button not found!");
  }

  // Attach back button listener
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      onBack();
    });
  } else {
    console.error("Back button not found!");
  }
}