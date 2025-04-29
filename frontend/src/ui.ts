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
  let registerButton = document.getElementById("registerButton") as HTMLButtonElement;
  let loginButton = document.getElementById("loginButton") as HTMLButtonElement;
  // Remove old listeners by replacing with clone
  if (registerButton) {
    const newRegisterButton = registerButton.cloneNode(true) as HTMLButtonElement;
    registerButton.parentNode?.replaceChild(newRegisterButton, registerButton);
    registerButton = newRegisterButton;
    registerButton.addEventListener("click", onRegister);
  }
  if (loginButton) {
    const newLoginButton = loginButton.cloneNode(true) as HTMLButtonElement;
    loginButton.parentNode?.replaceChild(newLoginButton, loginButton);
    loginButton = newLoginButton;
    loginButton.addEventListener("click", onLogin);
  }
}

// ------------------------------------------
// Section 2: Welcome Page (Post-Login)
// ------------------------------------------
// Renders the post-login welcome page with user info and game options
export function renderLoggedInWelcomePage(
  onLogout: () => void,
  username: string,
  email: string,
  onPlayMatch: (mode: string) => void,
  onPlayTournament: () => void,
  onSettings: () => void,
): string {
  return `
    <div class="logged-in-container">
      <button id="toggleSidebarButton" class="toggle-button">
        Menu
      </button>
      <div id="sidebar" class="sidebar">
        <img
          src="http://localhost:4000/avatar/${encodeURIComponent(username)}"
          class="avatar"
          alt="Profile"
          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iNTAiIGZpbGw9IiNmNGMyYzIiLz48cGF0aCBkPSJNMzAgMTgwYzAtNDAgNjAtNzAgMTQwLTcwczE0MCAzMCAxNDAgNzBIMzB6IiBmaWxsPSIjZjRjMmMyIi8+PC9zdmc+'; this.onerror=null;"
        />
        <h2 class="sidebar-username">${username}</h2>
        <p class="sidebar-email">${email}</p>
        <div class="sidebar-friend-search">
          <input type="text" id="friendSearchInput" class="form-input" placeholder="search for friends" style="font-style: italic;" onfocus="this.style.fontStyle='normal'" onblur="if(!this.value)this.style.fontStyle='italic'" />
        </div>
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
              <option value="multiplayer">Multiplayer</option>
            </select>
            <button id="playMatchButton" class="action-button">
              Play Match
            </button>
          </div>
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
  onPlayMatch: (mode: string) => void,
  onPlayTournament: () => void,
  onSettings: () => void,
  navigate: (path: string) => void
) {
  let logoutLink = document.getElementById("logoutLink");
  let settingsLink = document.getElementById("settingsLink");
  let profileLink = document.getElementById("profileLink");
  let playMatchButton = document.getElementById("playMatchButton");
  let playTournamentButton = document.getElementById("playTournamentButton");
  let gameModeSelect = document.getElementById("gameModeSelect");
  let toggleSidebarButton = document.getElementById("toggleSidebarButton");
  let sidebar = document.getElementById("sidebar");

  // Remove old listeners by replacing with clone
  if (logoutLink) {
    const newLogoutLink = logoutLink.cloneNode(true) as HTMLElement;
    logoutLink.parentNode?.replaceChild(newLogoutLink, logoutLink);
    logoutLink = newLogoutLink;
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      onLogout();
    });
  }
  if (settingsLink) {
    const newSettingsLink = settingsLink.cloneNode(true) as HTMLElement;
    settingsLink.parentNode?.replaceChild(newSettingsLink, settingsLink);
    settingsLink = newSettingsLink;
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      onSettings();
    });
  }
  if (profileLink) {
    const newProfileLink = profileLink.cloneNode(true) as HTMLElement;
    profileLink.parentNode?.replaceChild(newProfileLink, profileLink);
    profileLink = newProfileLink;
    profileLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/profile");
    });
  }
  if (playMatchButton && gameModeSelect) {
    const newPlayMatchButton = playMatchButton.cloneNode(true) as HTMLElement;
    playMatchButton.parentNode?.replaceChild(newPlayMatchButton, playMatchButton);
    playMatchButton = newPlayMatchButton;
    playMatchButton.addEventListener("click", (e) => {
      e.preventDefault();
      const selectedMode = (gameModeSelect as HTMLSelectElement).value;
      if (selectedMode === "multiplayer") {
        navigate("/multiplayer");
        return;
      }
      onPlayMatch(selectedMode);
    });
  }
  if (playTournamentButton) {
    const newPlayTournamentButton = playTournamentButton.cloneNode(true) as HTMLElement;
    playTournamentButton.parentNode?.replaceChild(newPlayTournamentButton, playTournamentButton);
    playTournamentButton = newPlayTournamentButton;
    playTournamentButton.addEventListener("click", (e) => {
      e.preventDefault();
      onPlayTournament();
    });
  }
  if (toggleSidebarButton && sidebar) {
    const newToggleSidebarButton = toggleSidebarButton.cloneNode(true) as HTMLElement;
    toggleSidebarButton.parentNode?.replaceChild(newToggleSidebarButton, toggleSidebarButton);
    toggleSidebarButton = newToggleSidebarButton;
    toggleSidebarButton.addEventListener("click", () => {
      sidebar.classList.toggle("visible");
    });
    document.addEventListener("click", (e) => {
      const target = e.target as Node;
      if (
        sidebar.classList.contains("visible") &&
        !sidebar.contains(target) &&
        toggleSidebarButton && !toggleSidebarButton.contains(target)
      ) {
        sidebar.classList.remove("visible");
      }
    });
  }

  // Friend search logic
  const friendSearchInput = document.getElementById("friendSearchInput") as HTMLInputElement;
  let friendSearchDropdown: HTMLDivElement | null = null;
  // Helper to track if dropdown should stay open
  let dropdownShouldStayOpen = false;

  if (friendSearchInput) {
    // Remove any previous dropdown
    const removeDropdown = () => {
      if (friendSearchDropdown && friendSearchDropdown.parentElement) {
        friendSearchDropdown.parentElement.removeChild(friendSearchDropdown);
        friendSearchDropdown = null;
      }
      dropdownShouldStayOpen = false;
    };

    friendSearchInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && friendSearchInput.value.trim()) {
        e.preventDefault();
        removeDropdown();
        const searchName = friendSearchInput.value.trim();
        friendSearchInput.disabled = true;
        try {
          const sessionToken = localStorage.getItem("sessionToken");
          const res = await fetch(`http://localhost:4000/users/search?name=${encodeURIComponent(searchName)}`, {
            headers: sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {}
          });
          const data = await res.json();
          if (data && data.user && data.user.name !== username) {
            // Show dropdown with Add Friend button
            friendSearchDropdown = document.createElement("div");
            friendSearchDropdown.className = "friend-search-dropdown";
            friendSearchDropdown.style.position = "absolute";
            friendSearchDropdown.style.background = "#222";
            friendSearchDropdown.style.color = "#fff";
            friendSearchDropdown.style.border = "1px solid #444";
            friendSearchDropdown.style.zIndex = "1000";
            friendSearchDropdown.style.left = friendSearchInput.offsetLeft + "px";
            friendSearchDropdown.style.top = (friendSearchInput.offsetTop + friendSearchInput.offsetHeight) + "px";
            friendSearchDropdown.style.width = friendSearchInput.offsetWidth + "px";
            friendSearchDropdown.innerHTML = `
              <div style="padding: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span>${data.user.name}</span>
                <button id="addFriendBtn" class="form-button" style="margin-left: 8px;">Add Friend</button>
              </div>
            `;
            friendSearchInput.parentElement!.appendChild(friendSearchDropdown);
            dropdownShouldStayOpen = true;
            const addFriendBtn = friendSearchDropdown.querySelector("#addFriendBtn") as HTMLButtonElement;
            addFriendBtn.addEventListener("click", async () => {
              addFriendBtn.disabled = true;
              addFriendBtn.textContent = "Adding...";
              try {
                const addRes = await fetch("http://localhost:4000/friends/add", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionToken}`
                  },
                  body: JSON.stringify({ friendId: data.user.id })
                });
                const addData = await addRes.json();
                if (addRes.ok && addData.status === "Friend added") {
                  addFriendBtn.textContent = "Added!";
                  setTimeout(() => {
                    removeDropdown();
                    friendSearchInput.value = "";
                  }, 1000);
                } else {
                  addFriendBtn.textContent = addData.error || addData.status || "Error";
                  setTimeout(removeDropdown, 2000);
                }
              } catch (err) {
                addFriendBtn.textContent = "Error";
                setTimeout(removeDropdown, 2000);
              }
            });
          } else if (data && data.user && data.user.name === username) {
            // Can't add yourself
            friendSearchDropdown = document.createElement("div");
            friendSearchDropdown.className = "friend-search-dropdown";
            friendSearchDropdown.style.position = "absolute";
            friendSearchDropdown.style.background = "#222";
            friendSearchDropdown.style.color = "#fff";
            friendSearchDropdown.style.border = "1px solid #444";
            friendSearchDropdown.style.zIndex = "1000";
            friendSearchDropdown.style.left = friendSearchInput.offsetLeft + "px";
            friendSearchDropdown.style.top = (friendSearchInput.offsetTop + friendSearchInput.offsetHeight) + "px";
            friendSearchDropdown.style.width = friendSearchInput.offsetWidth + "px";
            friendSearchDropdown.innerHTML = `<div style="padding: 8px;">You can't add yourself.</div>`;
            friendSearchInput.parentElement!.appendChild(friendSearchDropdown);
            dropdownShouldStayOpen = false;
            setTimeout(removeDropdown, 2000);
          } else {
            // Not found
            friendSearchDropdown = document.createElement("div");
            friendSearchDropdown.className = "friend-search-dropdown";
            friendSearchDropdown.style.position = "absolute";
            friendSearchDropdown.style.background = "#222";
            friendSearchDropdown.style.color = "#fff";
            friendSearchDropdown.style.border = "1px solid #444";
            friendSearchDropdown.style.zIndex = "1000";
            friendSearchDropdown.style.left = friendSearchInput.offsetLeft + "px";
            friendSearchDropdown.style.top = (friendSearchInput.offsetTop + friendSearchInput.offsetHeight) + "px";
            friendSearchDropdown.style.width = friendSearchInput.offsetWidth + "px";
            friendSearchDropdown.innerHTML = `<div style="padding: 8px;">No user found.</div>`;
            friendSearchInput.parentElement!.appendChild(friendSearchDropdown);
            dropdownShouldStayOpen = false;
            setTimeout(removeDropdown, 2000);
          }
        } catch (err) {
          removeDropdown();
        } finally {
          friendSearchInput.disabled = false;
        }
      }
    });
    // Remove dropdown on blur, but only if it shouldn't stay open
    friendSearchInput.addEventListener("blur", () => {
      setTimeout(() => {
        if (!dropdownShouldStayOpen) removeDropdown();
      }, 200);
    });
    // Remove dropdown if clicking outside
    document.addEventListener("mousedown", (e) => {
      if (friendSearchDropdown && !friendSearchDropdown.contains(e.target as Node) && e.target !== friendSearchInput) {
        removeDropdown();
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
            <label for="avatar" class="block text-white text-lg">Profile Picture:</label>
            <input type="file" id="avatar" class="form-input" accept="image/*">
            <p id="avatarError" class="error-message">File must be an image under 2MB.</p>
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
  const avatarError = document.getElementById("avatarError") as HTMLParagraphElement;

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

    // Validate avatar if one was selected
    let avatar: File | undefined;
    if (avatarInput.files && avatarInput.files.length > 0) {
      avatar = avatarInput.files[0];
      if (!avatar.type.startsWith('image/')) {
        avatarError.textContent = 'File must be an image.';
        avatarError.classList.add("visible");
        isValid = false;
      } else if (avatar.size > 2 * 1024 * 1024) { // 2MB
        avatarError.textContent = 'Image must be under 2MB.';
        avatarError.classList.add("visible");
        isValid = false;
      } else {
        avatarError.classList.remove("visible");
      }
    }

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
  playerStats: PlayerStats,
  matchHistory: MatchRecord[],
  gameStats: Record<string, GameStats>,
  friends: { id: number, name: string, online: boolean }[]
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

  return `
    <div class="profile-page">
      <div class="profile-header" style="background-color: rgba(0, 0, 0, 0.5); border: 2px solid #f4c2c2; border-radius: 12px; box-shadow: 0 0 15px rgba(244, 194, 194, 0.5);">
        <div class="profile-user-info">
          <img
            src=""
            class="profile-avatar"
          />
          <div class="profile-text-info">
            <h1 class="profile-username">${escapeHtml(username)}</h1>
            <p class="profile-email">${escapeHtml(email)}</p>
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
                <h3>${escapeHtml(gameType === 'Online Pong' ? 'Online Pong (Multiplayer)' : gameType)}</h3>
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

        <div class="profile-section friends-section" style="background-color: rgba(0, 0, 0, 0.5); border: 2px solid #f4c2c2; border-radius: 12px; box-shadow: 0 0 15px rgba(244, 194, 194, 0.5);">
          <h2>Friends</h2>
          <div class="friends-list">
            ${friends && friends.length > 0
              ? `<ul class="friends-list">${friends.map(friend => `
                  <li class="friend-item" style="
                    display: inline-block;
                    margin: 4px 8px 4px 0;
                    padding: 6px 16px 6px 16px;
                    background: linear-gradient(90deg, #f4c2c2 0%, #d8a8b5 100%);
                    color: #222;
                    border-radius: 20px;
                    font-weight: 500;
                    font-size: 1rem;
                    box-shadow: 0 2px 8px rgba(244, 194, 194, 0.15);
                    position: relative;
                  ">
                    <span>${escapeHtml(friend.name)}</span>
                    <span style="
                      display: inline-block;
                      width: 10px;
                      height: 10px;
                      border-radius: 50%;
                      background: ${friend.online ? '#22c55e' : '#ef4444'};
                      margin-left: 10px;
                      vertical-align: middle;
                      box-shadow: 0 0 4px ${friend.online ? '#22c55e' : '#ef4444'}44;
                    "></span>
                  </li>`).join('')}</ul>`
              : `<div class="no-friends">No friends yet.</div>`}
          </div>
        </div>

        <div class="profile-section">
          <h2>Match History</h2>
          <div class="match-history-scroll">
            <ul class="match-history-list">
              ${matchHistory.length === 0
                ? `<li class="no-matches">No matches played yet.</li>`
                : matchHistory
                    .map(
                      (match) => `
                        <li class="match-history-item ${match.winner === username ? 'victory' : 'defeat'}">
                          <div class="match-result">${match.winner === username ? 'Victory' : 'Defeat'}</div>
                          <div class="match-players">
                            <span class="winner">${escapeHtml(match.winner)}</span>
                            <span class="vs">vs</span>
                            <span class="loser">${escapeHtml(match.loser)}</span>
                          </div>
                          <div class="match-date">${new Date(match.timestamp).toLocaleString()}</div>
                        </li>
                      `
                    )
                    .join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupGameChart(canvas: HTMLCanvasElement, gameType: string): void {
  const ctx = canvas.getContext('2d')!;
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

  // Removed game type label under the chart for cleaner look
}

export function setupProfilePage(onBack: () => void): void {
  // Add event listener for back button if it exists
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", onBack);
  }

  // Setup charts for each game type
  // Dynamically find all chart canvases and set up their charts, including Online Pong
  const chartCanvases = document.querySelectorAll(".game-type-stats canvas");
  chartCanvases.forEach((canvas) => {
    const id = canvas.id;
    // Extract game type from id
    let gameType = id.replace(/-chart$/, '').replace(/-/g, ' ');
    // Capitalize each word
    gameType = gameType.replace(/\b\w/g, c => c.toUpperCase());
    if (gameType === 'Online Pong') gameType = 'Online Pong';
    setupGameChart(canvas as HTMLCanvasElement, gameType);
  });
}

// Renders the multiplayer menu with matchmaking and invite options
export function renderMultiplayerMenu(): string {
  return `
    <div class="full-screen-container">
      <div class="welcome-container">
        <h1 class="neon-title">
          Multiplayer Pong
        </h1>
        <p class="welcome-subtitle">
          Play against other players online
        </p>
        <div class="flex flex-col gap-4">
          <button id="matchmakingButton" class="welcome-button">
            Matchmaking
          </button>
          <button id="inviteFriendButton" class="welcome-button">
            Invite Friend
          </button>
          <button id="backButton" class="welcome-button">
            Back
          </button>
        </div>
      </div>
    </div>
  `;
}

// Sets up event listeners for the multiplayer menu
export function setupMultiplayerMenu(navigate: (path: string) => void): void {
  const matchmakingButton = document.getElementById("matchmakingButton");
  const inviteFriendButton = document.getElementById("inviteFriendButton");
  const backButton = document.getElementById("backButton");

  if (matchmakingButton) {
    matchmakingButton.addEventListener("click", async () => {
      // Start matchmaking
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        alert("You must be logged in to play multiplayer.");
        navigate("/login");
        return;
      }
      
      try {
        // Join matchmaking
        const response = await fetch("http://localhost:4000/matchmaking/join", {
          method: "POST",
          headers: { "Authorization": `Bearer ${sessionToken}` },
        });
        
        if (!response.ok) {
          throw new Error("Failed to join matchmaking");
        }
        
        const data = await response.json();
        console.log("Matchmaking join response:", data);
        
        // Always show waiting UI first unless explicitly paired
        const app = document.getElementById("app");
        if (app) app.innerHTML = renderWaitingForOpponent();
        let polling = true;
        
        setupWaitingForOpponent(() => {
          polling = false;
          navigate("/multiplayer");
        });

        // Only navigate to game if explicitly paired with a match ID
        if (data.status === "ready" && data.matchId) {
          navigate(`/multiplayerGame/${data.matchId}`);
          return;
        }

        // Otherwise, start polling for match
        const userId = data.userId;
        if (!userId) {
          throw new Error("No user ID received from matchmaking");
        }

        const poll = async () => {
          if (!polling) return;
          try {
            const statusRes = await fetch(`http://localhost:4000/matchmaking/status/${userId}`, {
              headers: { "Authorization": `Bearer ${sessionToken}` },
            });
            
            if (!statusRes.ok) {
              throw new Error("Failed to get matchmaking status");
            }
            
            const status = await statusRes.json();
            console.log("Matchmaking status:", status);
            
            if (status.status === "ready" && status.matchId) {
              navigate(`/multiplayerGame/${status.matchId}`);
            } else {
              setTimeout(poll, 2000);
            }
          } catch (error) {
            console.error("Error polling matchmaking status:", error);
            polling = false;
            navigate("/multiplayer");
          }
        };
        
        poll();
      } catch (error) {
        console.error("Matchmaking error:", error);
        alert("Failed to join matchmaking. Please try again.");
        navigate("/multiplayer");
      }
    });
  }

  if (inviteFriendButton) {
    inviteFriendButton.addEventListener("click", () => {
      alert("Friend invites coming soon!");
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      navigate("/");
    });
  }
}

// Renders the waiting for opponent UI
export function renderWaitingForOpponent(): string {
  return `
    <div class="full-screen-container">
      <div class="welcome-container">
        <h1 class="neon-title">Waiting for Opponent...</h1>
        <p class="welcome-subtitle">Another player will join soon.</p>
        <div class="flex flex-col gap-4">
          <button id="cancelMatchmakingButton" class="welcome-button">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

export function setupWaitingForOpponent(onCancel: () => void) {
  const cancelButton = document.getElementById("cancelMatchmakingButton");
  if (cancelButton) {
    cancelButton.addEventListener("click", onCancel);
  }
}

export function escapeHtml(str: string): string {
  // Check if the string contains any HTML tags or script tags
  if (/<[^>]*>|<\/[^>]*>|javascript:|on\w+\s*=/.test(str)) {
    return "Nice try! 😄";
  }
  return String(str).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]!));
}