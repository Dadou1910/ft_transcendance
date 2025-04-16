export interface User {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

export class Tournament {
  private players: string[] = [];
  private users: User[] = [];
  private currentUserEmail: string | null = null;

  constructor() {
    // Load current user from localStorage on initialization
    this.currentUserEmail = localStorage.getItem("currentUserEmail") || null;
  }

  addPlayers(playerLeft: string, playerRight: string) {
    this.players = [playerLeft, playerRight];
  }

  getPlayers(): [string, string] {
    return [this.players[0] || "Player 1", this.players[1] || "Player 2"];
  }

  hasPlayers(): boolean {
    return this.players.length === 2;
  }

  addUser(username: string, email: string, password: string, avatar?: File) {
    let avatarUrl: string | undefined;
    if (avatar) {
      try {
        avatarUrl = URL.createObjectURL(avatar);
      } catch (error) {
        console.error("Failed to create avatar URL:", error);
      }
    }
    const user = { username, email: email.toLowerCase(), password, avatarUrl };
    this.users.push(user);
    console.log("Added user:", { username, email, avatarUrl });
  }

  hasUser(username: string): boolean {
    const exists = this.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    console.log("Checking if user exists:", { username, exists });
    return exists;
  }

  getUserByEmail(email: string): User | undefined {
    const user = this.users.find((user) => user.email === email.toLowerCase());
    console.log("getUserByEmail:", { email, found: !!user });
    return user;
  }

  setCurrentUser(email: string) {
    console.log("Setting current user to:", email);
    this.currentUserEmail = email.toLowerCase();
    localStorage.setItem("currentUserEmail", this.currentUserEmail); // Persist to localStorage
  }

  getCurrentUser(): User | null {
    if (!this.currentUserEmail) {
      console.log("No current user set");
      return null;
    }
    const user = this.getUserByEmail(this.currentUserEmail);
    console.log("getCurrentUser:", user ? user.email : "none");
    return user || null;
  }

  logout() {
    console.log("Logging out, clearing current user");
    this.currentUserEmail = null;
    localStorage.removeItem("currentUserEmail"); // Clear from localStorage
  }
}