const uuidv4 = () => crypto.randomUUID();
// Imports Router class for client-side routing
import { Router } from "./router.js";
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
} from "./ui.js";
// Imports Tournament class for managing tournament logic
import { Tournament } from "./tournament.js";
// Imports base PongGame class
import { PongGame } from "./game.js";
// Imports NeonCityPong class for the neon-themed game mode
import { NeonCityPong } from "./neonCityPong.js";
// Imports AI Pong class for AI opponent mode
import { AIPong } from "./AIPong.js";
// Imports SpaceBattle class for the space-themed game mode
import { SpaceBattle } from "./spaceBattle.js";
// Imports Bracket class for tournament bracket management
import { Bracket } from "./bracket.js";
// Imports StatsManager and Player type for player statistics
import { StatsManager, Player } from "./stats.js";

// Initializes StatsManager for tracking player stats
const statsManager = new StatsManager();
// Generates a unique ID for the tournament
let tournamentId = uuidv4();
// Creates a new Tournament instance
const tournament = new Tournament(statsManager, tournamentId);
// Initializes Router with the app container ID and route listener setup
const router = new Router("app", setupRouteListeners);
// Stores the current game instance (PongGame, NeonCityPong, AIPong, or SpaceBattle)
let gameInstance: PongGame | SpaceBattle | null = null;
// Stores the current tournament bracket instance
let bracketInstance: Bracket | null = null;
// Tracks whether the game is in tournament mode
let isTournamentMode: boolean = false;
// Stores the backend tournament ID
let backendTournamentId: number | null = null;

// Defines navigate function to handle route changes
const navigate = (path: string) => router.navigate(path);

// Helper function to get current user from backend
async function getCurrentUser(): Promise<{ id: number; username: string; email: string; avatarUrl?: string } | null> {
  const userId = localStorage.getItem("currentUserId");
  console.log("Fetching current user with userId:", userId); // Added for debugging
  if (!userId || isNaN(parseInt(userId))) {
    console.log("Invalid or missing userId, clearing localStorage"); // Added for debugging
    localStorage.removeItem("currentUserId"); // Clear invalid userId
    return null;
  }
  try {
    const response = await fetch(`http://localhost:4000/profile/${userId}`);
    console.log("Profile fetch response status:", response.status); // Added for debugging
    if (!response.ok) throw new Error("Failed to fetch user");
    const { user } = await response.json();
    return { id: user.id, username: user.name, email: user.email, avatarUrl: user.avatarUrl };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

// Defines root route ("/")
router.addRoute("/", () => {
  return "";
});

// Defines welcome route ("/welcome")
router.addRoute("/welcome", () => {
  return "";
});

// Defines registration route ("/register")
router.addRoute("/register", () => {
  console.log("Rendering /register route");
  return renderRegistrationForm(async (username, email, password, avatar) => {
    console.log("Register onSubmit called");
    try {
      const response = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert((data.error as string) || "Registration failed");
        return;
      }
      console.log("Navigating to /");
      router.navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Server error during registration");
    }
  });
});

// Defines login route ("/login")
router.addRoute("/login", () => {
  console.log("Rendering /login route");
  return renderLoginForm(
    async (email, password) => {
      console.log("Login onSubmit called with:", { email });
      try {
        const response = await fetch("http://localhost:4000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          const data = await response.json();
          alert((data.error as string) || "Invalid email or password");
          return;
        }
        const user = await response.json();
        console.log("Credentials valid, setting current user");
        // Validate user.id before storing
        if (typeof user.id !== "number" || isNaN(user.id)) {
          console.error("Invalid user ID received:", user.id);
          localStorage.removeItem("currentUserId"); // Clear invalid userId
          alert("Login failed: Invalid user ID");
          return;
        }
        localStorage.setItem("currentUserId", user.id.toString());
        console.log("Current user set to:", user.email);
        console.log("Attempting navigation to /");
        router.navigate("/");
      } catch (error) {
        console.error("Login error:", error);
        alert("Server error during login");
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
  return renderNameEntryForm(async (player1, player2, player3, player4) => {
    const playerNames = [player1, player2, player3, player4].filter(name => name);
    // Validates that exactly four players are entered
    if (playerNames.length !== 4) {
      alert("Exactly four players are required for a tournament.");
      return;
    }
    try {
      // Fetch user IDs for player names
      const userIds: number[] = [];
      for (const name of playerNames) {
        const response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error(`User ${name} not found`);
        const { user } = await response.json();
        userIds.push(user.id);
      }
      // Create tournament on backend
      const response = await fetch("http://localhost:4000/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error((data.error as string) || "Failed to create tournament");
      }
      const { tournamentId: newTournamentId } = await response.json();
      backendTournamentId = newTournamentId;
      tournamentId = newTournamentId.toString(); // Update local tournamentId
      // Adds players to tournament and creates bracket
      tournament.addPlayers(playerNames);
      const players: Player[] = playerNames.map(name => ({ id: uuidv4(), name }));
      bracketInstance = new Bracket(players, statsManager, tournamentId);
      isTournamentMode = true;
      router.navigate("/game");
    } catch (error) {
      console.error("Tournament creation error:", error);
      alert("Failed to create tournament: " + (error instanceof Error ? error.message : "Unknown error"));
    }
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
          // Tournament win is recorded by backend in /tournament/match/winner
          const currentPlayers = tournament.getPlayers();
          isTournamentMode = false;
          bracketInstance = null;
          tournament.clearPlayers();
          backendTournamentId = null;
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
      isTournamentMode ? async (winnerName: string) => {
        if (bracketInstance && backendTournamentId) {
          const match = bracketInstance.getNextMatch();
          if (match) {
            const winnerId = match.player1.name === winnerName ? match.player1.id : match.player2.id;
            try {
              // Fetch user IDs for players
              const player1Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(match.player1.name)}`);
              const player2Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(match.player2.name)}`);
              if (!player1Response.ok || !player2Response.ok) throw new Error("Player not found");
              const { user: player1 } = await player1Response.json();
              const { user: player2 } = await player2Response.json();
              const winnerUserId = match.player1.name === winnerName ? player1.id : player2.id;
              // Create tournament match on backend
              const matchResponse = await fetch("http://localhost:4000/tournament/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tournamentId: backendTournamentId,
                  roundNumber: (match as any).roundNumber || 1,
                  player1Id: player1.id,
                  player2Id: player2.id,
                }),
              });
              if (!matchResponse.ok) throw new Error("Failed to create match");
              const { matchId } = await matchResponse.json();
              // Set match winner
              const winnerResponse = await fetch("http://localhost:4000/tournament/match/winner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tournamentId: backendTournamentId,
                  matchId,
                  winnerId: winnerUserId,
                }),
              });
              if (!winnerResponse.ok) throw new Error("Failed to set match winner");
              bracketInstance.setMatchWinner(match.id, winnerId);
              router.navigate("/game");
            } catch (error) {
              console.error("Error recording match winner:", error);
              alert("Failed to record match winner");
            }
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
          // Tournament win is recorded by backend in /tournament/match/winner
          const currentPlayers = tournament.getPlayers();
          isTournamentMode = false;
          bracketInstance = null;
          tournament.clearPlayers();
          backendTournamentId = null;
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
      isTournamentMode ? async (winnerName: string) => {
        if (bracketInstance && backendTournamentId) {
          const match = bracketInstance.getNextMatch();
          if (match) {
            const winnerId = match.player1.name === winnerName ? match.player1.id : match.player2.id;
            try {
              // Fetch user IDs for players
              const player1Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(match.player1.name)}`);
              const player2Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(match.player2.name)}`);
              if (!player1Response.ok || !player2Response.ok) throw new Error("Player not found");
              const { user: player1 } = await player1Response.json();
              const { user: player2 } = await player2Response.json();
              const winnerUserId = match.player1.name === winnerName ? player1.id : player2.id;
              // Create tournament match on backend
              const matchResponse = await fetch("http://localhost:4000/tournament/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tournamentId: backendTournamentId,
                  roundNumber: (match as any).roundNumber || 1,
                  player1Id: player1.id,
                  player2Id: player2.id,
                }),
              });
              if (!matchResponse.ok) throw new Error("Failed to create match");
              const { matchId } = await matchResponse.json();
              // Set match winner
              const winnerResponse = await fetch("http://localhost:4000/tournament/match/winner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tournamentId: backendTournamentId,
                  matchId,
                  winnerId: winnerUserId,
                }),
              });
              if (!winnerResponse.ok) throw new Error("Failed to set match winner");
              bracketInstance.setMatchWinner(match.id, winnerId);
              router.navigate("/neonCityGame");
            } catch (error) {
              console.error("Error recording match winner:", error);
              alert("Failed to record match winner");
            }
          }
        }
      } : undefined
    );
  }, 0);
  return html;
});

// Defines AI game route ("/aiGame")
router.addRoute("/aiGame", () => {
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  const [left] = tournament.getPlayers();
  const right = "AI Opponent";
  const html = renderGameView(left, right);
  setTimeout(() => {
    gameInstance = new AIPong(
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
      undefined,
      navigate
    );
    // No need to call resizeCanvas or start; handled in constructor
  }, 0);
  return html;
});

// Defines space battle game route ("/spaceBattleGame")
router.addRoute("/spaceBattleGame", () => {
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  let left: string, right: string;
  if (isTournamentMode && bracketInstance) {
    const match = bracketInstance.getNextMatch();
    if (!match) {
      const winnerId = bracketInstance.getWinner();
      if (winnerId) {
        const winner = bracketInstance.getRounds().flat().find(m => m.player1.id === winnerId || m.player2.id === winnerId);
        if (winner) {
          const winnerName = winner.player1.id === winnerId ? winner.player1.name : winner.player2.name;
          // Tournament win is recorded by backend in /tournament/match/winner
          const currentPlayers = tournament.getPlayers();
          isTournamentMode = false;
          bracketInstance = null;
          tournament.clearPlayers();
          backendTournamentId = null;
          const html = renderTournamentEnd(winnerName);
          setTimeout(() => {
            setupTournamentEnd(
              () => {
                tournament.addPlayers(currentPlayers);
                const players: Player[] = currentPlayers.map(name => ({ id: uuidv4(), name }));
                bracketInstance = new Bracket(players, statsManager, tournamentId);
                isTournamentMode = true;
                router.navigate("/spaceBattleGame");
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
    [left, right] = tournament.getPlayers();
  }
  const html = renderGameView(left, right, isTournamentMode ? bracketInstance?.getCurrentRound() : undefined);
  setTimeout(() => {
    gameInstance = new SpaceBattle(
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
      isTournamentMode ? async (winnerName: string) => {
        if (bracketInstance && backendTournamentId) {
          const match = bracketInstance.getNextMatch();
          if (match) {
            const winnerId = match.player1.name === winnerName ? match.player1.id : match.player2.id;
            try {
              // Fetch user IDs for players
              const player1Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(match.player1.name)}`);
              const player2Response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(match.player2.name)}`);
              if (!player1Response.ok || !player2Response.ok) throw new Error("Player not found");
              const { user: player1 } = await player1Response.json();
              const { user: player2 } = await player2Response.json();
              const winnerUserId = match.player1.name === winnerName ? player1.id : player2.id;
              // Create tournament match on backend
              const matchResponse = await fetch("http://localhost:4000/tournament/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tournamentId: backendTournamentId,
                  roundNumber: (match as any).roundNumber || 1,
                  player1Id: player1.id,
                  player2Id: player2.id,
                }),
              });
              if (!matchResponse.ok) throw new Error("Failed to create match");
              const { matchId } = await matchResponse.json();
              // Set match winner
              const winnerResponse = await fetch("http://localhost:4000/tournament/match/winner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tournamentId: backendTournamentId,
                  matchId,
                  winnerId: winnerUserId,
                }),
              });
              if (!winnerResponse.ok) throw new Error("Failed to set match winner");
              bracketInstance.setMatchWinner(match.id, winnerId);
              router.navigate("/spaceBattleGame");
            } catch (error) {
              console.error("Error recording match winner:", error);
              alert("Failed to record match winner");
            }
          }
        }
      } : undefined
    );
    // No need to call resizeCanvas or start; handled in constructor
  }, 0);
  return html;
});

// Starts the router
router.start();

// Sets up event listeners for each route
function setupRouteListeners() {
  console.log("Setting up route listeners for pathname:", window.location.pathname);
  if (window.location.pathname === "/" || window.location.pathname === "/welcome") {
    getCurrentUser().then(currentUser => {
      const appContainer = document.getElementById("app");
      if (!appContainer) return;
      if (currentUser) {
        console.log("Setting up logged-in welcome page");
        appContainer.innerHTML = renderLoggedInWelcomePage(
          currentUser.username,
          currentUser.email,
          currentUser.avatarUrl
        );
        setupLoggedInWelcomePage(
          () => {
            console.log("Logout triggered from logged-in welcome page");
            localStorage.removeItem("currentUserId");
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
              if (selectedMode === "standard") {
                router.navigate("/game");
              } else if (selectedMode === "neonCity") {
                router.navigate("/neonCityGame");
              } else if (selectedMode === "ai") {
                router.navigate("/aiGame");
              } else if (selectedMode === "spaceBattle") {
                router.navigate("/spaceBattleGame");
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
        console.log("Setting up pre-login welcome page");
        appContainer.innerHTML = renderWelcomePage(
          () => router.navigate("/register"),
          () => router.navigate("/login")
        );
        setupWelcomePage(
          () => router.navigate("/register"),
          () => router.navigate("/login")
        );
      }
    });
  } else if (window.location.pathname === "/register") {
    console.log("Setting up registration form");
    setupRegistrationForm(async (username, email, password, avatar) => {
      console.log("Registration form submitted");
      try {
        const response = await fetch("http://localhost:4000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: username, email, password }),
        });
        if (!response.ok) {
          const data = await response.json();
          alert((data.error as string) || "Registration failed");
          return;
        }
        console.log("Navigating to / from setup");
        router.navigate("/");
      } catch (error) {
        console.error("Registration error:", error);
        alert("Server error during registration");
      }
    });
  } else if (window.location.pathname === "/login") {
    console.log("Setting up login form");
    setupLoginForm(
      async (email, password) => {
        console.log("Login form submitted from setup with:", { email });
        try {
          const response = await fetch("http://localhost:4000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!response.ok) {
            const data = await response.json();
            alert((data.error as string) || "Invalid email or password");
            return;
          }
          const user = await response.json();
          console.log("Credentials valid from setup, setting current user");
          // Validate user.id before storing
          if (typeof user.id !== "number" || isNaN(user.id)) {
            console.error("Invalid user ID received:", user.id);
            localStorage.removeItem("currentUserId"); // Clear invalid userId
            alert("Login failed: Invalid user ID");
            return;
          }
          localStorage.setItem("currentUserId", user.id.toString());
          console.log("Current user set to:", user.email);
          console.log("Attempting navigation to / from setup");
          router.navigate("/");
        } catch (error) {
          console.error("Login error:", error);
          alert("Server error during login");
        }
      },
      () => {
        console.log("onRegister callback triggered from login setup");
        router.navigate("/register");
      }
    );
  } else if (window.location.pathname === "/tournament") {
    if (tournament.hasPlayers() && isTournamentMode) {
      router.navigate("/game");
    } else {
      setupNameForm(async (player1: string, player2: string, player3: string, player4: string): Promise<void> => {
        const playerNames = [player1, player2, player3, player4].filter(name => name);
        if (playerNames.length !== 4) {
          alert("Exactly four players are required for a tournament.");
          return;
        }
        try {
          // Fetch user IDs for player names
          const userIds: number[] = [];
          for (const name of playerNames) {
            const response = await fetch(`http://localhost:4000/profile/${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error(`User ${name} not found`);
            const { user } = await response.json();
            userIds.push(user.id);
          }
          // Create tournament on backend
          const response = await fetch("http://localhost:4000/tournament", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error((data.error as string) || "Failed to create tournament");
          }
          const { tournamentId: newTournamentId } = await response.json();
          backendTournamentId = newTournamentId;
          tournamentId = newTournamentId.toString(); // Update local tournamentId
          tournament.addPlayers(playerNames);
          const players: Player[] = playerNames.map(name => ({ id: uuidv4(), name }));
          bracketInstance = new Bracket(players, statsManager, tournamentId);
          isTournamentMode = true;
          router.navigate("/game");
        } catch (error) {
          console.error("Tournament creation error:", error);
          alert("Failed to create tournament: " + (error instanceof Error ? error.message : "Unknown error"));
        }
      });
    }
  }
}

// Listens for browser back/forward navigation
window.addEventListener("popstate", () => {
  console.log("popstate event, pathname:", window.location.pathname);
  router.handleRouteChange();
});