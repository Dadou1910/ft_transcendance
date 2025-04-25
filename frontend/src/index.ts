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
  const sessionToken = localStorage.getItem("sessionToken");
  console.log("Fetching current user with sessionToken:", sessionToken); // Added for debugging
  if (!sessionToken) {
    console.log("Missing sessionToken, clearing localStorage"); // Added for debugging
    localStorage.removeItem("sessionToken"); // Clear invalid token
    return null;
  }
  try {
    const response = await fetch(`http://localhost:4000/profile/me`, {
      headers: { "Authorization": `Bearer ${sessionToken}` }
    });
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
      const sessionToken = localStorage.getItem("sessionToken");
      const response = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {})
        },
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
        console.log("Credentials valid, setting session token");
        // Validate sessionToken before storing
        if (!user.sessionToken || typeof user.sessionToken !== "string") {
          console.error("Invalid session token received:", user.sessionToken);
          localStorage.removeItem("sessionToken"); // Clear invalid token
          alert("Login failed: Invalid session token");
          return;
        }
        localStorage.setItem("sessionToken", user.sessionToken);
        console.log("Session token set for user:", user.email);
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
  if (tournament.hasPlayers() && isTournamentMode) {
    router.navigate("/game");
    return "";
  }
  return renderNameEntryForm(async (player1, player2, player3, player4) => {
    const playerNames = [player1, player2, player3, player4]
      .map(name => name?.trim())
      .filter(name => name && name.length > 0);
    if (playerNames.length !== 4) {
      alert("Exactly four players are required for a tournament. Names cannot be empty or whitespace-only.");
      return;
    }
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        throw new Error("User not logged in");
      }
      const response = await fetch(`http://localhost:4000/profile/me`, {
        headers: { "Authorization": `Bearer ${sessionToken}` }
      });
      if (!response.ok) throw new Error("Failed to fetch logged-in user");
      const { user } = await response.json();
      
      if (playerNames[0] !== user.name) {
        throw new Error("First player name must match the logged-in user's username");
      }

      const tournamentResponse = await fetch("http://localhost:4000/tournament", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ usernames: playerNames }),
      });
      if (!tournamentResponse.ok) {
        const data = await tournamentResponse.json();
        throw new Error((data.error as string) || "Failed to create tournament");
      }
      const { tournamentId: newTournamentId } = await tournamentResponse.json();
      backendTournamentId = newTournamentId;
      tournamentId = newTournamentId.toString();
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

// Function to handle the /game route logic asynchronously
async function handleGameRoute(): Promise<string> {
  // Check if the user is logged in
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    router.navigate("/login");
    return "";
  }
  // Redirects to root if no players are in the tournament
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  let left: string, right: string;
  // Flag to prevent duplicate winner recording
  let winnerRecorded = false;
  // Handles tournament mode logic
  if (isTournamentMode && bracketInstance) {
    const match = bracketInstance.getNextMatch();
    // Handles tournament end
    if (!match) {
      const winnerId = bracketInstance.getWinner();
      if (winnerId && !winnerRecorded) {
        const winner = bracketInstance.getRounds().flat().find(m => m.player1.id === winnerId || m.player2.id === winnerId);
        if (winner) {
          const winnerName = winner.player1.id === winnerId ? winner.player1.name : winner.player2.name;
          const currentPlayers = tournament.getPlayers();
          isTournamentMode = false;
          bracketInstance = null;
          tournament.clearPlayers();
          backendTournamentId = null;
          winnerRecorded = true; // Prevent duplicate recording
          const html = renderTournamentEnd(winnerName);
          // Sets up tournament end page
          setTimeout(() => {
            setupTournamentEnd(
              async () => {
                // Create a new tournament on the backend
                try {
                  const sessionToken = localStorage.getItem("sessionToken");
                  if (!sessionToken) throw new Error("User not logged in");
                  const tournamentResponse = await fetch("http://localhost:4000/tournament", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${sessionToken}`
                    },
                    body: JSON.stringify({ usernames: currentPlayers }),
                  });
                  if (!tournamentResponse.ok) {
                    const data = await tournamentResponse.json();
                    throw new Error((data.error as string) || "Failed to create tournament");
                  }
                  const { tournamentId: newTournamentId } = await tournamentResponse.json();
                  backendTournamentId = newTournamentId;
                  tournamentId = newTournamentId.toString();
                  tournament.addPlayers(currentPlayers);
                  const players: Player[] = currentPlayers.map(name => ({ id: uuidv4(), name }));
                  bracketInstance = new Bracket(players, statsManager, tournamentId);
                  isTournamentMode = true;
                  winnerRecorded = false; // Reset for new tournament
                  router.navigate("/game");
                } catch (error) {
                  console.error("Error restarting tournament:", error);
                  alert("Failed to restart tournament: " + (error instanceof Error ? error.message : "Unknown error"));
                  router.navigate("/");
                }
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
  setTimeout(async () => {
    const currentUser = await getCurrentUser(); // Fetch again in case of timing issues
    if (!currentUser) {
      router.navigate("/login");
      return;
    }
    // In the /game route's setTimeout callback
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
  currentUser.username,
  isTournamentMode ? async (winnerName: string) => {
    if (!isTournamentMode) {
      console.log("Tournament mode ended, skipping onGameEnd");
      return;
    }
    if (bracketInstance && backendTournamentId) {
      const match = bracketInstance.getNextMatch();
      if (match) {
        const winnerId = match.player1.name === winnerName ? match.player1.id : match.player2.id;
        try {
          const sessionToken = localStorage.getItem("sessionToken");
          if (!sessionToken) throw new Error("User not logged in");

          // Fetch the logged-in user's profile
          const currentUserResponse = await fetch(`http://localhost:4000/profile/me`, {
            headers: { "Authorization": `Bearer ${sessionToken}` }
          });
          if (!currentUserResponse.ok) throw new Error("Failed to fetch logged-in user");

          // Get player names directly from the match (TournamentMatch)
          let player1Name = match.player1.name;
          let player2Name = match.player2.name;

          // Validate player names to ensure they're not empty or whitespace-only
          if (!player1Name?.trim() || !player2Name?.trim()) {
            throw new Error("Player names cannot be empty or whitespace-only");
          }

          // Use fields directly from TournamentMatch  * Ensure all fields are present
          if (!match.tournamentId || match.roundNumber == null) {
            throw new Error("Tournament match is missing required fields (tournamentId or roundNumber)");
          }

          // Debug the request body
          const requestBody = {
            tournamentId: backendTournamentId,
            roundNumber: match.roundNumber,
            player1: player1Name,
            player2: player2Name,
          };
          console.log("Sending /tournament/match request with body:", requestBody);

          // Create tournament match on backend
          const matchResponse = await fetch("http://localhost:4000/tournament/match", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify(requestBody),
          });
          if (!matchResponse.ok) {
            const errorData = await matchResponse.json();
            throw new Error(errorData.error || "Failed to create match");
          }
          const { matchId } = await matchResponse.json();

          // Set match winner
          const winnerResponse = await fetch("http://localhost:4000/tournament/match/winner", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
              tournamentId: backendTournamentId,
              matchId,
              winner: winnerName,
            }),
          });
          if (!winnerResponse.ok) {
            const errorData = await winnerResponse.json();
            throw new Error(errorData.error || "Failed to set match winner");
          }
          bracketInstance.setMatchWinner(match.id, winnerId);
          router.navigate("/game");
        } catch (error) {
          console.error("Error recording match winner:", error);
          alert("Failed to record match winner: " + (error instanceof Error ? error.message : "Unknown error"));
        }
      } else {
        console.error("No match found from getNextMatch");
      }
    } else {
      console.error("bracketInstance or backendTournamentId is null", { bracketInstance, backendTournamentId });
    }
  } : undefined,
  navigate,
  false,
  isTournamentMode
);
  }, 0);
  return html;
}

// Defines standard game route ("/game")
router.addRoute("/game", () => {
  // Since addRoute expects a synchronous string return, we call the async handler
  // and immediately return a placeholder string. The actual rendering is handled
  // by the async function.
  handleGameRoute().then(html => {
    const appContainer = document.getElementById("app");
    if (appContainer) {
      appContainer.innerHTML = html;
    }
  }).catch(error => {
    console.error("Error in /game route:", error);
    router.navigate("/"); // Redirect to root on error
  });
  return ""; // Return placeholder string synchronously
});

// Defines neon city game route ("/neonCityGame")
router.addRoute("/neonCityGame", () => {
  // Redirects to root if no players are in the tournament
  if (!tournament.hasPlayers()) {
    router.navigate("/");
    return "";
  }
  let left: string, right: string;
  // Uses default players (non-tournament mode only)
  [left, right] = tournament.getPlayers();
  // Renders game view (without tournament round information)
  const html = renderGameView(left, right);
  // Initializes NeonCityPong instance (without onGameEnd callback)
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
      statsManager.getCurrentUser()?.username || null,
      navigate,
      undefined // No onGameEnd callback since this route doesn't support tournament mode
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
      statsManager.getCurrentUser()?.username || null,
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
  // Uses default players (non-tournament mode only)
  [left, right] = tournament.getPlayers();
  const html = renderGameView(left, right);
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
      statsManager.getCurrentUser()?.username || null,
      navigate,
      undefined // No onGameEnd callback since this route doesn't support tournament mode
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
          async () => {
            console.log("Logout triggered from logged-in welcome page");
            const sessionToken = localStorage.getItem("sessionToken");
            if (sessionToken) {
              try {
                await fetch("http://localhost:4000/logout", {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${sessionToken}` }
                });
              } catch (error) {
                console.error("Logout error:", error);
              }
            }
            localStorage.removeItem("sessionToken");
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
        const sessionToken = localStorage.getItem("sessionToken");
        const response = await fetch("http://localhost:4000/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {})
          },
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
          console.log("Credentials valid from setup, setting session token");
          // Validate sessionToken before storing
          if (!user.sessionToken || typeof user.sessionToken !== "string") {
            console.error("Invalid session token received:", user.sessionToken);
            localStorage.removeItem("sessionToken"); // Clear invalid token
            alert("Login failed: Invalid session token");
            return;
          }
          localStorage.setItem("sessionToken", user.sessionToken);
          console.log("Session token set for user:", user.email);
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
      getCurrentUser().then(currentUser => {
        if (!currentUser) {
          console.log("No logged-in user found, redirecting to /login");
          router.navigate("/login");
          return;
        }
        setupNameForm(
          async (player1: string, player2: string, player3: string, player4: string): Promise<void> => {
            const playerNames = [player1, player2, player3, player4].filter(name => name);
            if (playerNames.length !== 4) {
              alert("Exactly four players are required for a tournament.");
              return;
            }
            try {
              // Validate that the first player name matches the logged-in user's username
              if (playerNames[0] !== currentUser.username) {
                throw new Error("First player name must match the logged-in user's username");
              }

              // Create tournament on backend with usernames
              const sessionToken = localStorage.getItem("sessionToken");
              const tournamentResponse = await fetch("http://localhost:4000/tournament", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ usernames: playerNames }),
              });
              if (!tournamentResponse.ok) {
                const data = await tournamentResponse.json();
                throw new Error((data.error as string) || "Failed to create tournament");
              }
              const { tournamentId: newTournamentId } = await tournamentResponse.json();
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
          },
          currentUser.username // Pass the logged-in user's username to pre-fill the form
        );
      }).catch(error => {
        console.error("Error fetching current user for tournament form:", error);
        router.navigate("/login");
      });
    }
  }
}

// Listens for browser back/forward navigation
window.addEventListener("popstate", () => {
  console.log("popstate event, pathname:", window.location.pathname);
  router.handleRouteChange();
});