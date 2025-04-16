// ------------------------------------------
// Section 1: Welcome Page (Pre-Login)
// ------------------------------------------
// This section handles the rendering of the welcome page for non-logged-in users.

const WELCOME_CONTAINER_STYLE = `
  bg-black bg-opacity-80 p-8 rounded-lg text-center relative overflow-hidden
  background-size: 20px, 30px; background-position: top left, bottom right;
  background-repeat: no-repeat, no-repeat; box-shadow: 0 0 15px rgba(255, 182, 193, 0.5);
`;

const WELCOME_BUTTON_STYLE = `
  bg-[#47d2fc] text-white border-none rounded-md py-2 px-5 mt-4 cursor-pointer
  hover:bg-[#2a86bb] transition-colors
`;

export function renderWelcomePage(onRegister: () => void, onLogin: () => void): string {
  return `
    <div class="${WELCOME_CONTAINER_STYLE}">
      <h1 class="text-5xl text-white mb-4 font-bold" style="text-shadow: 0 0 10px #47d2fc, 0 0 20px #2a86bb;">
        Pong Transcendence
      </h1>
      <p class="text-lg text-[#47d2fc] mb-6">
        Challenge Your Friends in a Neon Pong Arena
      </p>
      <div class="flex flex-col gap-4">
        <button id="registerButton" class="${WELCOME_BUTTON_STYLE}">
          Register
        </button>
        <button id="loginButton" class="${WELCOME_BUTTON_STYLE}">
          Login
        </button>
      </div>
    </div>
  `;
}

export function setupWelcomePage(onRegister: () => void, onLogin: () => void) {
  const registerButton = document.getElementById("registerButton") as HTMLButtonElement;
  const loginButton = document.getElementById("loginButton") as HTMLButtonElement;
  registerButton.addEventListener("click", onRegister);
  loginButton.addEventListener("click", onLogin);
}

// ------------------------------------------
// Section 2: Welcome Page (Post-Login)
// ------------------------------------------
// This section handles the rendering of the welcome page for logged-in users.

const LOGGED_IN_CONTAINER_STYLE = `
  flex min-h-screen w-screen h-screen bg-black post-login-page
`;

const SIDEBAR_STYLE = `
  fixed top-0 left-0 w-64 bg-gray-900 bg-opacity-70 p-6 flex flex-col gap-4 h-full
  style="border-right: 2px solid #f4c2c2; box-shadow: 0 0 10px rgba(255, 182, 193, 0.3);"
`;

const AVATAR_STYLE = `
  w-24 h-24 rounded-full border-2 border-[#f4c2c2] bg-black object-cover
`;

const SIDEBAR_LINK_STYLE = `
  text-[#f4c2c2] hover:text-[#ffb6c1] cursor-pointer
`;

const MAIN_CONTENT_STYLE = `
  flex-1 p-8 flex flex-col items-center justify-center bg-black bg-opacity-80 ml-64
`;

const ACTION_BUTTON_STYLE = `
  bg-[#f4c2c2] text-white border-none rounded-md py-3 px-8 mt-4 cursor-pointer
  hover:bg-[#ffb6c1] transition-colors text-lg font-semibold
`;

export function renderLoggedInWelcomePage(
  username: string,
  email: string,
  avatarUrl?: string
): string {
  const avatarSrc = avatarUrl || '';
  return `
    <div class="${LOGGED_IN_CONTAINER_STYLE}">
      <div class="${SIDEBAR_STYLE}">
        <img
          src="${avatarSrc}"
          class="${AVATAR_STYLE}"
          ${avatarSrc ? '' : 'style="background-color: black;"'}
        />
        <h2 class="text-white text-xl font-bold">${username}</h2>
        <p class="text-[#f4c2c2]">${email}</p>
        <div class="mt-6 flex flex-col gap-2">
          <a class="${SIDEBAR_LINK_STYLE}">Settings</a>
          <a class="${SIDEBAR_LINK_STYLE}">Leaderboard</a>
          <a class="${SIDEBAR_LINK_STYLE}">Profile</a>
          <a id="logoutLink" class="${SIDEBAR_LINK_STYLE}">Logout</a>
        </div>
      </div>
      <div class="${MAIN_CONTENT_STYLE}">
        <h1 class="text-4xl text-white mb-8 font-bold" style="text-shadow: 0 0 10px rgba(255, 182, 193, 0.7);">
          Welcome, ${username}!
        </h1>
        <div class="flex flex-col gap-6">
          <button id="playTournamentButton" class="${ACTION_BUTTON_STYLE}">
            Play Tournament
          </button>
          <button id="playMatchButton" class="${ACTION_BUTTON_STYLE}">
            Play Match
          </button>
        </div>
      </div>
    </div>
  `;
}

export function setupLoggedInWelcomePage(
  onLogout: () => void,
  username: string,
  onPlayMatch: () => void
) {
  const logoutLink = document.getElementById("logoutLink") as HTMLAnchorElement;
  const playMatchButton = document.getElementById("playMatchButton") as HTMLButtonElement;

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

  if (playMatchButton) {
    console.log("Attaching listener to play match button");
    playMatchButton.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Play Match button clicked, calling onPlayMatch");
      try {
        onPlayMatch();
      } catch (error) {
        console.error("Error in onPlayMatch:", error);
      }
    });
  } else {
    console.error("Play Match button not found!");
  }
}

// ------------------------------------------
// Section 3: Name Entry Form (Tournament)
// ------------------------------------------
// This section handles the rendering of the name entry form for tournament players.

export function renderNameEntryForm(onSubmit: (left: string, right: string) => void): string {
  return `
    <form id="nameEntryForm" class="flex flex-col items-center gap-4">
      <h2 class="text-3xl text-white mb-4 font-bold" style="text-shadow: 0 0 10px #47d2fc;">
        Enter Player Names
      </h2>
      <input
        id="playerLeftInput"
        type="text"
        placeholder="Player 1 Name"
        class="w-64"
        required
      />
      <input
        id="playerRightInput"
        type="text"
        placeholder="Player 2 Name"
        class="w-64"
        required
      />
      <button type="submit" class="mt-4">
        Start Tournament
      </button>
    </form>
  `;
}

export function setupNameForm(onSubmit: (left: string, right: string) => void) {
  const form = document.getElementById("nameEntryForm") as HTMLFormElement;
  const playerLeftInput = document.getElementById("playerLeftInput") as HTMLInputElement;
  const playerRightInput = document.getElementById("playerRightInput") as HTMLInputElement;

  if (form && playerLeftInput && playerRightInput) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const left = playerLeftInput.value.trim();
      const right = playerRightInput.value.trim();
      if (left && right) {
        onSubmit(left, right);
      } else {
        alert("Please enter names for both players.");
      }
    });
  } else {
    console.error("Name entry form elements not found!");
  }
}

// ------------------------------------------
// Section 4: Game Screen
// ------------------------------------------
// This section handles the rendering of the game screen, including the canvas, score, and settings.

const SCORE_CONTAINER_STYLE = `
  flex justify-around w-[800px] text-2xl bg-black bg-opacity-50 p-2 rounded-md
`;

const SETTINGS_BUTTON_STYLE = `
  bg-black text-white border-2 border-white rounded-md w-10 h-10 cursor-pointer
  hover:bg-gray-700 hover:border-[#ffb6c1]
  style="background-image: url('/assets/setting.png'); background-size: 28px 28px;
  background-repeat: no-repeat; background-position: center;"
`;

const SETTINGS_MENU_STYLE = `
  hidden absolute top-full left-0 min-w-[250px] bg-black border-2 border-white rounded-md p-2 z-10
  flex flex-col gap-2
`;

const SELECT_STYLE = `
  bg-black text-white border-2 border-white rounded-md p-1 w-48 hover:bg-gray-700 appearance-none
  style="background-image: url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>'); background-repeat: no-repeat; background-position: right 10px center;"
`;

const RESTART_BUTTON_STYLE = `
  rounded bg-black text-white border-2 border-white py-2 px-5 transition-opacity
  hover:bg-gray-700
`;

export function renderGameView(playerLeftName: string, playerRightName: string): string {
  const leftDisplayName = playerLeftName.trim() || "Player 1";
  const rightDisplayName = playerRightName.trim() || "Player 2";
  return `
    <div id="gameContainer" class="flex flex-col justify-center items-center gap-4">
      <div class="score-container ${SCORE_CONTAINER_STYLE}">
        <span><span id="playerLeftNameDisplay">${leftDisplayName}</span>: <span id="scoreLeft">0</span></span>
        <span><span id="playerRightNameDisplay">${rightDisplayName}</span>: <span id="scoreRight">0</span></span>
      </div>
      <div class="game-area flex gap-5 items-start">
        <canvas id="pongCanvas" width="800" height="400" class="border-2 border-white"></canvas>
        <div id="settingsContainer" class="relative w-10">
          <button id="settingsButton" class="${SETTINGS_BUTTON_STYLE}"></button>
          <div id="settingsMenu" class="${SETTINGS_MENU_STYLE}">
            <div class="flex items-center gap-2">
              <label for="backgroundColorSelect" class="text-white whitespace-nowrap">Color:</label>
              <select id="backgroundColorSelect" class="${SELECT_STYLE}">
                <option value="#d8a8b5">Pastel Pink</option>
                <option value="#b8b8d8">Soft Lavender</option>
                <option value="#a8c8b5">Mint Green</option>
                <option value="#a9c3d9">Baby Blue</option>
                <option value="#d9c9a8">Cream</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label for="speedSlider" class="text-white">Ball Speed:</label>
              <input type="range" id="speedSlider" min="1" max="10" value="5" class="w-48 h-2 bg-[#f4c2c2] rounded-md outline-none appearance-none">
            </div>
          </div>
        </div>
      </div>
      <button id="restartButton" class="${RESTART_BUTTON_STYLE}">Start</button>
    </div>
  `;
}

// ------------------------------------------
// Section 5: Registration Form
// ------------------------------------------
// This section handles the rendering and setup of the registration form view.

const REGISTRATION_FORM_CONTAINER_STYLE = `
  bg-black bg-opacity-80 p-5 rounded-lg text-center relative overflow-hidden
  style="background-image: url('/assets/flower.png'), url('/assets/flower.png');
  background-size: 20px, 30px; background-position: top left, bottom right;
  background-repeat: no-repeat, no-repeat; box-shadow: 0 0 15px rgba(255, 182, 193, 0.5);"
`;

const REGISTRATION_FORM_INPUT_STYLE = `
  bg-gray-800 text-white border-2 border-[#f4c2c2] rounded-md p-2 mt-1
  focus:outline-none focus:border-[#ffb6c1] focus:shadow-[0_0_5px_rgba(255,182,193,0.7)]
`;

const REGISTRATION_FORM_BUTTON_STYLE = `
  bg-[#f4c2c2] text-white border-none rounded-md py-2 px-5 mt-2 cursor-pointer
  hover:bg-[#ffb6c1] transition-colors
`;

const ERROR_MESSAGE_STYLE = `
  text-red-500 text-sm mt-1 hidden
`;

export function renderRegistrationForm(onSubmit: (username: string, email: string, password: string, avatar?: File) => void): string {
  return `
    <div id="registrationFormContainer" class="${REGISTRATION_FORM_CONTAINER_STYLE}">
      <h2 class="text-white mb-5 text-2xl" style="text-shadow: 0 0 5px rgba(255, 182, 193, 0.7);">
        Create Your Account
      </h2>
      <form id="registrationForm" class="flex flex-col gap-4">
        <div>
          <label for="username" class="block text-white text-lg">Username:</label>
          <input type="text" id="username" class="${REGISTRATION_FORM_INPUT_STYLE}" required>
          <p id="usernameError" class="${ERROR_MESSAGE_STYLE}">Username must be 3-20 characters, alphanumeric only.</p>
        </div>
        <div>
          <label for="email" class="block text-white text-lg">Email:</label>
          <input type="email" id="email" class="${REGISTRATION_FORM_INPUT_STYLE}" required>
          <p id="emailError" class="${ERROR_MESSAGE_STYLE}">Please enter a valid email address.</p>
        </div>
        <div>
          <label for="password" class="block text-white text-lg">Password:</label>
          <input type="password" id="password" class="${REGISTRATION_FORM_INPUT_STYLE}" required>
          <p id="passwordError" class="${ERROR_MESSAGE_STYLE}">Password must be at least 8 characters, including a number and a special character.</p>
        </div>
        <div>
          <label for="avatar" class="block text-white text-lg">Avatar (Optional):</label>
          <input type="file" id="avatar" accept="image/*" class="${REGISTRATION_FORM_INPUT_STYLE}">
        </div>
        <button type="submit" class="${REGISTRATION_FORM_BUTTON_STYLE}">Register</button>
      </form>
    </div>
  `;
}

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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Registration form submitted");
    let isValid = true;

    // Username validation: 3-20 characters, alphanumeric
    const username = usernameInput.value.trim();
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!usernameRegex.test(username)) {
      usernameError.classList.remove("hidden");
      isValid = false;
    } else {
      usernameError.classList.add("hidden");
    }

    // Email validation
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailError.classList.remove("hidden");
      isValid = false;
    } else {
      emailError.classList.add("hidden");
    }

    // Password validation: 8+ characters, 1 number, 1 special character
    const password = passwordInput.value;
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      passwordError.classList.remove("hidden");
      isValid = false;
    } else {
      passwordError.classList.add("hidden");
    }

    // Avatar is optional
    const avatar = avatarInput.files?.[0];

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
// This section handles the rendering and setup of the login form view.

const LOGIN_FORM_CONTAINER_STYLE = `
  bg-black bg-opacity-80 p-5 rounded-lg text-center relative overflow-hidden
  style="background-image: url('/assets/flower.png'), url('/assets/flower.png');
  background-size: 20px, 30px; background-position: top left, bottom right;
  background-repeat: no-repeat, no-repeat; box-shadow: 0 0 15px rgba(255, 182, 193, 0.5);"
`;

const LOGIN_FORM_INPUT_STYLE = `
  bg-gray-800 text-white border-2 border-[#f4c2c2] rounded-md p-2 mt-1
  focus:outline-none focus:border-[#ffb6c1] focus:shadow-[0_0_5px_rgba(255,182,193,0.7)]
`;

const LOGIN_FORM_BUTTON_STYLE = `
  bg-[#f4c2c2] text-white border-none rounded-md py-2 px-5 mt-2 cursor-pointer
  hover:bg-[#ffb6c1] transition-colors
`;

const LOGIN_FORM_LINK_STYLE = `
  text-[#f4c2c2] hover:text-[#ffb6c1] underline cursor-pointer
`;

export function renderLoginForm(onSubmit: (email: string, password: string) => void, onRegister: () => void): string {
  return `
    <div id="loginFormContainer" class="${LOGIN_FORM_CONTAINER_STYLE}">
      <h2 class="text-white mb-5 text-2xl" style="text-shadow: 0 0 5px rgba(255, 182, 193, 0.7);">
        Login to Your Account
      </h2>
      <form id="loginForm" class="flex flex-col gap-4" autocomplete="off">
        <div>
          <label for="email" class="block text-white text-lg">Email:</label>
          <input type="email" id="email" class="${LOGIN_FORM_INPUT_STYLE}" required autocomplete="off">
          <p id="emailError" class="${ERROR_MESSAGE_STYLE}">Please enter a valid email address.</p>
        </div>
        <div>
          <label for="password" class="block text-white text-lg">Password:</label>
          <input type="password" id="password" class="${LOGIN_FORM_INPUT_STYLE}" required autocomplete="off">
          <p id="passwordError" class="${ERROR_MESSAGE_STYLE}">Password is required.</p>
        </div>
        <button type="submit" class="${LOGIN_FORM_BUTTON_STYLE}">Login</button>
      </form>
      <p class="text-white mt-4">
        Don't have an account? 
        <a id="registerLink" class="${LOGIN_FORM_LINK_STYLE}" href="/register">Create one here</a>.
      </p>
    </div>
  `;
}

export function setupLoginForm(onSubmit: (email: string, password: string) => void, onRegister: () => void) {
    const form = document.getElementById("loginForm") as HTMLFormElement;
    let registerLink = document.getElementById("registerLink") as HTMLAnchorElement;
  
    if (!form) {
      console.error("Login form not found!");
      return;
    }
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
  
    form.addEventListener("submit", (e) => {
      console.log("Login form submit event triggered");
      e.preventDefault();
  
      let isValid = true;
      const email = emailInput.value.trim();
      const password = passwordInput.value;
  
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("Email validation failed:", email);
        emailError.classList.remove("hidden");
        isValid = false;
      } else {
        emailError.classList.add("hidden");
      }
  
      // Password validation: non-empty
      if (!password) {
        console.log("Password validation failed: empty");
        passwordError.classList.remove("hidden");
        isValid = false;
      } else {
        passwordError.classList.add("hidden");
      }
  
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
  }