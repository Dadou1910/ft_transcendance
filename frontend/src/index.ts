// Imports UUID generator for unique IDs
import { v4 as uuidv4 } from "uuid";
// Imports Router class for client-side routing
import { Router } from "./router";
// Imports UI rendering and setup functions for various pages
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
  renderTournamentEnd,
  setupTournamentEnd,
} from "./ui";
// Imports Tournament class for managing tournament logic
import { Tournament } from "./tournament";
// Imports base PongGame class
import { PongGame } from "./game";
// Imports NeonCityPong class for the neon-themed game mode
import { NeonCityPong } from "./neonCityPong";
// Imports Bracket class for tournament bracket management
import { Bracket } from "./bracket";
// Imports StatsManager and Player type for player statistics
import { StatsManager, Player } from "./stats";

// Initializes StatsManager for tracking player stats
const statsManager = new StatsManager();
// Generates a unique ID for the tournament
const tournamentId = uuidv4();
// Creates a new Tournament instance
const tournament = new Tournament(statsManager, tournamentId);
// Initializes Router with the app container ID and route listener setup
const router = new Router("app", setupRouteListeners);
// Stores the current game instance (PongGame or NeonCityPong)
let gameInstance: PongGame | null = null;
// Stores the current tournament bracket instance
let bracketInstance: Bracket | null = null;
// Tracks whether the game is in tournament mode
let isTournamentMode: boolean = false;

// Defines navigate function to handle route changes
const navigate = (path: string) => router.navigate(path);

// Defines root route ("/")
router.addRoute("/", () => {
  const currentUser = statsManager.getCurrentUser();
  // Renders logged-in welcome page if user is authenticated
  if (currentUser) {
    console.log("Rendering logged-in welcome page for:", currentUser.username);
    return renderLoggedInWelcomePage(
      currentUser.username,
      currentUser.email,
      currentUser.avatarUrl
    );
  }
  // Renders pre-login welcome page otherwise
  console.log("Rendering pre-login welcome page");
  return renderWelcomePage(
    () => router.navigate("/register"),
    () => router.navigate("/login")
  );
});

// Defines welcome route ("/welcome")
router.addRoute("/welcome", () => {
  const currentUser = statsManager.getCurrentUser();
  // Renders logged-in welcome page if user is authenticated
  if (currentUser) {
    console.log("Rendering logged-in welcome page for:", currentUser.username);
    return renderLoggedInWelcomePage(
      currentUser.username,
      currentUser.email,
      currentUser.avatarUrl
    );
  }
  // Redirects to root if no user is logged in
  console.log("Redirecting to / as no user is logged in");
  router.navigate("/");
  return "";
});

// Defines registration route ("/register")
router.addRoute("/register", () => {
  console.log("Rendering /register route");
  // Renders registration form with submit handler
  return renderRegistrationForm((username, email, password, avatar) => {
    console.log("Register onSubmit called");
    // Checks if username is already taken
    if (statsManager.hasUser(username)) {
      alert("Username already exists. Please choose another.");
      return;
    }
    // Adds new user to stats manager
    statsManager.addUser(username, email, password, avatar);
    console.log("Navigating to /");
    router.navigate("/");
  });
});

// Defines login route ("/login")
router.addRoute("/login", () => {
  console.log("Rendering /login route");
  // Renders login form with submit and register navigation handlers
  return renderLoginForm(
    (email, password) => {
      console.log("Login onSubmit called with:", { email });
      const user = statsManager.getUserByEmail(email);
      console.log("Found user:", user ? user.email : "none");
      // Validates credentials and sets current user
      if (user && user.password === password) {
        console.log("Credentials valid, setting current user");
        statsManager.setCurrentUser(email);
        console.log("Current user set to:", statsManager.getCurrentUser()?.email);
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

// Defines tournament route ("/tournament")
router.addRoute("/tournament", () => {
  console.log("Rendering /tournament route");
  // Redirects to game route if tournament is active
  if (tournament.hasPlayers() && isTournamentMode) {
    router.navigate("/game");
    return "";
  }
  // Renders form to enter four player names
  return renderNameEntryForm((player1, player2, player3, player4) => {
    const playerNames = [player1, player2, player3, player4].filter(name => name);
    // Validates that exactly four players are entered
    if (playerNames.length !== 4) {
      alert("Exactly four players are required for a tournament.");
      return;
    }
    // Adds players to tournament and creates bracket
    tournament.addPlayers(playerNames);
    const players: Player[] = playerNames.map(name => ({ id: uuidv4(), name }));
    bracketInstance = new Bracket(players, statsManager, tournamentId);
    isTournamentMode = true;
    router.navigate("/game");
  });
});

// Defines standard game route ("/game")
router.addRoute("/game", () => {
  // Redirects to root if no players are in the tournament
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  let left: string, right: string;
  // Handles tournament mode logic
  if (isTournamentMode && bracketInstance) {
    const match = bracketInstance.getNextMatch();
    // Handles tournament end
    if (!match) {
      const winnerId = bracketInstance.getWinner();
      if (winnerId) {
        const winner = bracketInstance.getRounds().flat().find(m => m.player1.id === winnerId || m.player2.id === winnerId);
        if (winner) {
          const winnerName = winner.player1.id === winnerId ? winner.player1.name : winner.player2.name;
          statsManager.recordTournamentWin(winnerName);
          const currentPlayers = tournament.getPlayers();
          isTournamentMode = false;
          bracketInstance = null;
          tournament.clearPlayers();
          const html = renderTournamentEnd(winnerName);
          // Sets up tournament end page
          setTimeout(() => {
            setupTournamentEnd(
              () => {
                tournament.addPlayers(currentPlayers);
                const players: Player[] = currentPlayers.map(name => ({ id: uuidv4(), name }));
                bracketInstance = new Bracket(players, statsManager, tournamentId);
                isTournamentMode = true;
                router.navigate("/game");
              },
              () => {
                router.navigate("/");
              }
            );
          }, 0);
          return html;
        }
      }
      return "";
    }
    left = match.player1.name;
    right = match.player2.name;
  } else {
    // Uses default players for non-tournament mode
    [left, right] = tournament.getPlayers();
  }
  // Renders game view
  const html = renderGameView(left, right, isTournamentMode ? bracketInstance?.getCurrentRound() : undefined);
  // Initializes standard PongGame instance
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
      "settingsContainer",
      statsManager,
      statsManager.getCurrentUser()?.email || null,
      isTournamentMode ? (winnerName: string) => {
        if (bracketInstance) {
          const match = bracketInstance.getNextMatch();
          if (match) {
            const winnerId = match.player1.name === winnerName ? match.player1.id : match.player2.id;
            bracketInstance.setMatchWinner(match.id, winnerId);
            router.navigate("/game");
          }
        }
      } : undefined,
      navigate
    );
  }, 0);
  return html;
});

// Defines neon city game route ("/neonCityGame")
router.addRoute("/neonCityGame", () => {
  // Redirects to root if no players are in the tournament
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  let left: string, right: string;
  // Handles tournament mode logic
  if (isTournamentMode && bracketInstance) {
    const match = bracketInstance.getNextMatch();
    // Handles tournament end
    if (!match) {
      const winnerId = bracketInstance.getWinner();
      if (winnerId) {
        const winner = bracketInstance.getRounds().flat().find(m => m.player1.id === winnerId || m.player2.id === winnerId);
        if (winner) {
          const winnerName = winner.player1.id === winnerId ? winner.player1.name : winner.player2.name;
          statsManager.recordTournamentWin(winnerName);
          const currentPlayers = tournament.getPlayers();
          isTournamentMode = false;
          bracketInstance = null;
          tournament.clearPlayers();
          const html = renderTournamentEnd(winnerName);
          // Sets up tournament end page
          setTimeout(() => {
            setupTournamentEnd(
              () => {
                tournament.addPlayers(currentPlayers);
                const players: Player[] = currentPlayers.map(name => ({ id: uuidv4(), name }));
                bracketInstance = new Bracket(players, statsManager, tournamentId);
                isTournamentMode = true;
                router.navigate("/neonCityGame");
              },
              () => {
                router.navigate("/");
              }
            );
          }, 0);
          return html;
        }
      }
      return "";
    }
    left = match.player1.name;
    right = match.player2.name;
  } else {
    // Uses default players for non-tournament mode
    [left, right] = tournament.getPlayers();
  }
  // Renders game view
  const html = renderGameView(left, right, isTournamentMode ? bracketInstance?.getCurrentRound() : undefined);
  // Initializes NeonCityPong instance
  setTimeout(() => {
    gameInstance = new NeonCityPong(
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
      "settingsContainer",
      statsManager,
      statsManager.getCurrentUser()?.email || null,
      navigate,
      isTournamentMode ? (winnerName: string) => {
        if (bracketInstance) {
          const match = bracketInstance.getNextMatch();
          if (match) {
            const winnerId = match.player1.name === winnerName ? match.player1.id : match.player2.id;
            bracketInstance.setMatchWinner(match.id, winnerId);
            router.navigate("/neonCityGame");
          }
        }
      } : undefined
    );
  }, 0);
  return html;
});

// Starts the router
router.start();

// Sets up event listeners for each route
function setupRouteListeners() {
  console.log("Setting up route listeners for pathname:", window.location.pathname);
  // Handles root and welcome routes
  if (window.location.pathname === "/" || window.location.pathname === "/welcome") {
    const currentUser = statsManager.getCurrentUser();
    // Sets up logged-in welcome page
    if (currentUser) {
      console.log("Setting up logged-in welcome page");
      setupLoggedInWelcomePage(
        () => {
          console.log("Logout triggered from logged-in welcome page");
          statsManager.logout();
          router.navigate("/");
        },
        currentUser.username,
        () => {
          console.log("Play Match triggered, setting players and navigating");
          const gameModeSelect = document.getElementById("gameModeSelect") as HTMLSelectElement;
          if (gameModeSelect) {
            const selectedMode = gameModeSelect.value;
            tournament.addPlayers([currentUser.username, "Player 2"]);
            isTournamentMode = false;
            // Navigates to appropriate game mode
            if (selectedMode === "standard") {
              router.navigate("/game");
            } else if (selectedMode === "neonCity") {
              router.navigate("/neonCityGame");
            }
          } else {
            console.error("gameModeSelect not found!");
          }
        },
        () => {
          console.log("Play Tournament triggered, navigating to /tournament");
          tournament.clearPlayers();
          router.navigate("/tournament");
        }
      );
    } else {
      // Sets up pre-login welcome page
      console.log("Setting up pre-login welcome page");
      setupWelcomePage(
        () => router.navigate("/register"),
        () => router.navigate("/login")
      );
    }
  } else if (window.location.pathname === "/register") {
    // Sets up registration form
    console.log("Setting up registration form");
    setupRegistrationForm((username, email, password, avatar) => {
      console.log("Registration form submitted");
      if (statsManager.hasUser(username)) {
        alert("Username already exists. Please choose another.");
        return;
      }
      statsManager.addUser(username, email, password, avatar);
      console.log("Navigating to / from setup");
      router.navigate("/");
    });
  } else if (window.location.pathname === "/login") {
    // Sets up login form
    console.log("Setting up login form");
    setupLoginForm(
      (email, password) => {
        console.log("Login form submitted from setup with:", { email });
        const user = statsManager.getUserByEmail(email);
        console.log("Found user from setup:", user ? user.email : "none");
        if (user && user.password === password) {
          console.log("Credentials valid from setup, setting current user");
          statsManager.setCurrentUser(email);
          console.log("Current user set to:", statsManager.getCurrentUser()?.email);
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
    // Sets up tournament form or redirects to game
    if (tournament.hasPlayers() && isTournamentMode) {
      router.navigate("/game");
    } else {
      setupNameForm((player1: string, player2: string, player3: string, player4: string): void => {
        const playerNames = [player1, player2, player3, player4].filter(name => name);
        if (playerNames.length !== 4) {
          alert("Exactly four players are required for a tournament.");
          return;
        }
        tournament.addPlayers(playerNames);
        const players: Player[] = playerNames.map(name => ({ id: uuidv4(), name }));
        bracketInstance = new Bracket(players, statsManager, tournamentId);
        isTournamentMode = true;
        router.navigate("/game");
      });
    }
  }
}

// Listens for browser back/forward navigation
window.addEventListener("popstate", () => {
  console.log("popstate event, pathname:", window.location.pathname);
  router.handleRouteChange();
});