import { PlayerStats, MatchRecord, GameStats } from './stats';

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
          <a id="settingsLink" class="sidebar-link">Settings</a>
          <a class="sidebar-link">Leaderboard</a>
          <a id="profileLink" class="sidebar-link">Profile</a>
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
  onPlayTournament: () => void,
  onSettings: () => void,
  navigate: (path: string) => void
) {
  const logoutLink = document.getElementById("logoutLink");
  const settingsLink = document.getElementById("settingsLink");
  const profileLink = document.getElementById("profileLink");
  const playMatchButton = document.getElementById("playMatchButton");
  const playTournamentButton = document.getElementById("playTournamentButton");
  const playMultiplayerButton = document.getElementById("playMultiplayerButton");
  const gameModeSelect = document.getElementById("gameModeSelect");
  const toggleSidebarButton = document.getElementById("toggleSidebarButton");
  const sidebar = document.getElementById("sidebar");

  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      onLogout();
    });
  }

  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      onSettings();
    });
  }

  if (profileLink) {
    profileLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/profile");
    });
  }

  if (playMatchButton && gameModeSelect) {
    playMatchButton.addEventListener("click", (e) => {
      e.preventDefault();
      onPlayMatch();
    });
  }

  if (playTournamentButton) {
    playTournamentButton.addEventListener("click", (e) => {
      e.preventDefault();
      onPlayTournament();
    });
  }

  if (toggleSidebarButton && sidebar) {
    toggleSidebarButton.addEventListener("click", () => {
      sidebar.classList.toggle("visible");
    });

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

export function setupNameForm(
  onSubmit: (player1: string, player2: string, player3: string, player4: string) => void,
  loggedInUsername?: string
) {
  const form = document.getElementById("nameEntryForm") as HTMLFormElement;
  const player1Input = document.getElementById("player1Input") as HTMLInputElement;
  const player2Input = document.getElementById("player2Input") as HTMLInputElement;
  const player3Input = document.getElementById("player3Input") as HTMLInputElement;
  const player4Input = document.getElementById("player4Input") as HTMLInputElement;

  // Pre-fill the first player's field with the logged-in user's username and make it read-only
  if (loggedInUsername && player1Input) {
    player1Input.value = loggedInUsername;
    player1Input.readOnly = true;
  }

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
export function renderGameView(playerLeftName: string, playerRightName: string, roundNumber?: number): string {
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

export function renderSettingsPage(
  username: string,
  email: string
): string {
  return `
    <div class="settings-page">
      <div class="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your profile and preferences</p>
      </div>
      
      <div class="settings-content">
        <div class="settings-section">
          <h2>Profile Information</h2>
          <div class="settings-option">
            <label for="username">Username</label>
            <input type="text" id="username" class="text-input" value="${username || ''}" />
          </div>
          <div class="settings-option">
            <label for="email">Email Address</label>
            <input type="email" id="email" class="text-input" value="${email || ''}" />
          </div>
        </div>

        <div class="settings-section">
          <h2>Security</h2>
          <div class="settings-option">
            <label for="currentPassword">Current Password</label>
            <input type="password" id="currentPassword" class="text-input" />
          </div>
          <div class="settings-option">
            <label for="newPassword">New Password</label>
            <input type="password" id="newPassword" class="text-input" />
          </div>
          <div class="settings-option">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" class="text-input" />
          </div>
        </div>

        <div id="settingsError" class="settings-error"></div>

        <div class="settings-actions">
          <button id="backButton" class="secondary-button">Back</button>
          <button id="saveButton" class="primary-button">Save Changes</button>
        </div>
      </div>
    </div>
  `;
}

export function setupSettingsPage(
  onSave: (updates: { username?: string; email?: string; currentPassword?: string; newPassword?: string }) => void,
  onBack: () => void
): void {
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const currentPasswordInput = document.getElementById("currentPassword") as HTMLInputElement;
  const newPasswordInput = document.getElementById("newPassword") as HTMLInputElement;
  const confirmPasswordInput = document.getElementById("confirmPassword") as HTMLInputElement;
  const saveButton = document.getElementById("saveButton");
  const backButton = document.getElementById("backButton");
  const errorDiv = document.getElementById("settingsError");

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      // Clear previous error
      if (errorDiv) errorDiv.textContent = "";

      const updates: { username?: string; email?: string; currentPassword?: string; newPassword?: string } = {};
      let hasChanges = false;

      // Collect changes
      if (usernameInput && usernameInput.value.trim() !== usernameInput.defaultValue) {
        updates.username = usernameInput.value.trim();
        hasChanges = true;
      }

      if (emailInput && emailInput.value.trim() !== emailInput.defaultValue) {
        updates.email = emailInput.value.trim();
        hasChanges = true;
      }

      // Handle password change
      if (currentPasswordInput?.value && newPasswordInput?.value) {
        if (newPasswordInput.value.length < 8) {
          if (errorDiv) errorDiv.textContent = "New password must be at least 8 characters long";
          return;
        }

        if (newPasswordInput.value !== confirmPasswordInput?.value) {
          if (errorDiv) errorDiv.textContent = "New passwords do not match";
          return;
        }

        updates.currentPassword = currentPasswordInput.value;
        updates.newPassword = newPasswordInput.value;
        hasChanges = true;
      } else if (currentPasswordInput?.value || newPasswordInput?.value || confirmPasswordInput?.value) {
        if (errorDiv) errorDiv.textContent = "Please fill in all password fields to change password";
        return;
      }

      if (!hasChanges) {
        if (errorDiv) errorDiv.textContent = "No changes made";
        return;
      }

      onSave(updates);
    });
  }

  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      onBack();
    });
  }
}

// ------------------------------------------
// Section 8: Profile Dashboard
// ------------------------------------------
export function renderProfilePage(
  username: string,
  email: string,
  avatarUrl: string | undefined,
  playerStats: PlayerStats,
  matchHistory: MatchRecord[],
  gameStats: Record<string, GameStats>
): string {
  // Calculate total games and win rate from all game types combined
  let totalWins = 0;
  let totalLosses = 0;
  
  // Use playerStats for the overall stats (from database)
  totalWins = playerStats.wins;
  totalLosses = playerStats.losses;
  
  const totalGames = totalWins + totalLosses;
  const winRate = totalGames > 0
    ? ((totalWins / totalGames) * 100).toFixed(1)
    : "0.0";

  // Get the last 5 matches
  const recentMatches = matchHistory.slice(0, 5);

  return `
    <div class="profile-page">
      <div class="profile-header" style="background-color: rgba(0, 0, 0, 0.5); border: 2px solid #f4c2c2; border-radius: 12px; box-shadow: 0 0 15px rgba(244, 194, 194, 0.5);">
        <div class="profile-user-info">
          <img
            src="${avatarUrl || '/assets/default-avatar.png'}"
            class="profile-avatar"
          />
          <div class="profile-text-info">
            <h1 class="profile-username">${username}</h1>
            <p class="profile-email">${email}</p>
          </div>
        </div>
        <div class="profile-quick-stats">
          <div class="quick-stat">
            <span class="stat-value">${winRate}%</span>
            <span class="stat-label">Overall Win Rate</span>
          </div>
          <div class="quick-stat">
            <span class="stat-value">${playerStats.tournamentsWon}</span>
            <span class="stat-label">Tournaments Won</span>
          </div>
          <div class="quick-stat">
            <span class="stat-value">${totalGames}</span>
            <span class="stat-label">Total Games</span>
          </div>
        </div>
      </div>

      <div class="profile-content">
        <div class="profile-section game-stats-section" style="background-color: rgba(0, 0, 0, 0.5); border: 2px solid #f4c2c2; border-radius: 12px; box-shadow: 0 0 15px rgba(244, 194, 194, 0.5);">
          <h2>Current Session Statistics</h2>
          <div class="game-stats-grid">
            ${Object.entries(gameStats).map(([gameType, stats]) => `
              <div class="game-type-stats">
                <h3>${gameType}</h3>
                <canvas id="${gameType.replace(/\s+/g, '-').toLowerCase()}-chart" width="200" height="250"></canvas>
                <div class="game-type-details">
                  <p>Games Played: ${stats.gamesPlayed}</p>
                  <p>Wins: ${stats.wins}</p>
                  <p>Losses: ${stats.losses}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="profile-section match-history-section" style="background-color: rgba(0, 0, 0, 0.5); border: 2px solid #f4c2c2; border-radius: 12px; box-shadow: 0 0 15px rgba(244, 194, 194, 0.5);">
          <h2>Recent Matches</h2>
          <div class="match-history-list">
            ${recentMatches.length > 0 ? recentMatches.map(match => `
              <div class="match-history-item ${match.winner === username ? 'victory' : 'defeat'}">
                <div class="match-result">${match.winner === username ? 'Victory' : 'Defeat'}</div>
                <div class="match-players">
                  <span class="${match.winner === username ? 'winner' : 'loser'}">${username}</span>
                  <span class="vs">vs</span>
                  <span class="${match.winner === username ? 'loser' : 'winner'}">${match.winner === username ? match.loser : match.winner}</span>
                </div>
                <div class="match-date">${new Date(match.timestamp).toLocaleDateString()}</div>
              </div>
            `).join('') : `
              <div class="no-matches">No recent matches found</div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupGameChart(canvas: HTMLCanvasElement, gameType: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Get game stats from the canvas's parent element
  const statsContainer = canvas.closest('.game-type-stats');
  if (!statsContainer) return;

  const wins = parseInt(statsContainer.querySelector('.game-type-details p:nth-child(2)')?.textContent?.split(': ')[1] || '0');
  const losses = parseInt(statsContainer.querySelector('.game-type-details p:nth-child(3)')?.textContent?.split(': ')[1] || '0');

  // Draw pie chart
  const total = wins + losses;
  const startAngle = 0;
  const winAngle = total > 0 ? (wins / total) * Math.PI * 2 : 0;

  // Clear the canvas first
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw wins
  ctx.beginPath();
  ctx.fillStyle = '#4CAF50';
  ctx.moveTo(100, 100);
  ctx.arc(100, 100, 80, startAngle, startAngle + winAngle);
  ctx.lineTo(100, 100);
  ctx.fill();

  // Draw losses
  ctx.beginPath();
  ctx.fillStyle = '#f44336';
  ctx.moveTo(100, 100);
  ctx.arc(100, 100, 80, startAngle + winAngle, startAngle + Math.PI * 2);
  ctx.lineTo(100, 100);
  ctx.fill();

  // Add only the game type name
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(gameType, 100, 210);
}

export function setupProfilePage(onBack: () => void): void {
  // Add event listener for back button if it exists
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", onBack);
  }

  // Setup charts for each game type
  const gameTypes = ["Pong", "Neon City Pong", "AI Pong", "Space Battle"];
  gameTypes.forEach(gameType => {
    const canvasId = `${gameType.replace(/\s+/g, '-').toLowerCase()}-chart`;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      setupGameChart(canvas, gameType);
    }
  });
}