import { Router } from "./router";
import {
  renderWelcomePage,
  setupWelcomePage,
  renderNameEntryForm,
  setupNameForm,
  renderGameView,
  renderRegistrationForm,
  setupRegistrationForm,
  renderLoginForm,
  setupLoginForm,
  renderLoggedInWelcomePage,
  setupLoggedInWelcomePage,
} from "./ui";
import { Tournament } from "./tournament";
import { PongGame } from "./game";

const tournament = new Tournament();
const router = new Router("app", setupRouteListeners);
let gameInstance: PongGame | null = null;

// Route: Welcome Page (Pre- or Post-Login)
router.addRoute("/", () => {
  const currentUser = tournament.getCurrentUser();
  if (currentUser) {
    console.log("Rendering logged-in welcome page for:", currentUser.username);
    return renderLoggedInWelcomePage(
      currentUser.username,
      currentUser.email,
      currentUser.avatarUrl
    );
  }
  console.log("Rendering pre-login welcome page");
  return renderWelcomePage(
    () => router.navigate("/register"),
    () => router.navigate("/login")
  );
});

// Route: Registration Page
router.addRoute("/register", () => {
  console.log("Rendering /register route");
  return renderRegistrationForm((username, email, password, avatar) => {
    console.log("Register onSubmit called");
    if (tournament.hasUser(username)) {
      alert("Username already exists. Please choose another.");
      return;
    }
    tournament.addUser(username, email, password, avatar);
    console.log("Navigating to /");
    router.navigate("/");
  });
});

// Route: Login Page
router.addRoute("/login", () => {
  console.log("Rendering /login route");
  return renderLoginForm(
    (email, password) => {
      console.log("Login onSubmit called with:", { email });
      const user = tournament.getUserByEmail(email);
      console.log("Found user:", user ? user.email : "none");
      if (user && user.password === password) {
        console.log("Credentials valid, setting current user");
        tournament.setCurrentUser(email);
        console.log("Current user set to:", tournament.getCurrentUser()?.email);
        console.log("Attempting navigation to /");
        router.navigate("/");
      } else {
        console.log("Invalid credentials");
        alert("Invalid email or password.");
      }
    },
    () => {
      console.log("onRegister callback triggered from login");
      router.navigate("/register");
    }
  );
});

// Route: Name Entry (for Tournament)
router.addRoute("/tournament", () => {
  console.log("Rendering /tournament route");
  if (tournament.hasPlayers()) {
    router.navigate("/game");
    return "";
  }
  return renderNameEntryForm((left, right) => {
    tournament.addPlayers(left, right);
    router.navigate("/game");
  });
});

// Route: Game View
router.addRoute("/game", () => {
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  const [left, right] = tournament.getPlayers();
  const html = renderGameView(left, right);
  setTimeout(() => {
    gameInstance = new PongGame(
      left,
      right,
      "pongCanvas",
      "speedSlider",
      "backgroundColorSelect",
      "scoreLeft",
      "scoreRight",
      "restartButton",
      "settingsButton",
      "settingsMenu",
      "settingsContainer"
    );
  }, 0);
  return html;
});

// Start the router
router.start();

// Setup event listeners after rendering
function setupRouteListeners() {
  console.log("Setting up route listeners for pathname:", window.location.pathname);
  if (window.location.pathname === "/") {
    const currentUser = tournament.getCurrentUser();
    if (currentUser) {
      console.log("Setting up logged-in welcome page");
      setupLoggedInWelcomePage(
        () => {
          console.log("Logout triggered from logged-in welcome page");
          tournament.logout();
          router.navigate("/");
        },
        currentUser.username,
        () => {
          console.log("Play Match triggered, setting players and navigating to /game");
          tournament.addPlayers(currentUser.username, "Player 2");
          router.navigate("/game");
        }
      );
    } else {
      console.log("Setting up pre-login welcome page");
      setupWelcomePage(
        () => router.navigate("/register"),
        () => router.navigate("/login")
      );
    }
  } else if (window.location.pathname === "/register") {
    console.log("Setting up registration form");
    setupRegistrationForm((username, email, password, avatar) => {
      console.log("Registration form submitted");
      if (tournament.hasUser(username)) {
        alert("Username already exists. Please choose another.");
        return;
      }
      tournament.addUser(username, email, password, avatar);
      console.log("Navigating to / from setup");
      router.navigate("/");
    });
  } else if (window.location.pathname === "/login") {
    console.log("Setting up login form");
    setupLoginForm(
      (email, password) => {
        console.log("Login form submitted from setup with:", { email });
        const user = tournament.getUserByEmail(email);
        console.log("Found user from setup:", user ? user.email : "none");
        if (user && user.password === password) {
          console.log("Credentials valid from setup, setting current user");
          tournament.setCurrentUser(email);
          console.log("Current user set to:", tournament.getCurrentUser()?.email);
          console.log("Attempting navigation to / from setup");
          router.navigate("/");
        } else {
          console.log("Invalid credentials from setup");
          alert("Invalid email or password.");
        }
      },
      () => {
        console.log("onRegister callback triggered from login setup");
        router.navigate("/register");
      }
    );
  } else if (window.location.pathname === "/tournament") {
    if (tournament.hasPlayers()) {
      router.navigate("/game");
    } else {
      setupNameForm((left, right) => {
        tournament.addPlayers(left, right);
        router.navigate("/game");
      });
    }
  }
}

// Handle back/forward navigation
window.addEventListener("popstate", () => {
  console.log("popstate event, pathname:", window.location.pathname);
  router.handleRouteChange();
});