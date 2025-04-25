import { StatsManager } from "./stats.js";
import { renderSettingsPage, setupSettingsPage } from "./ui.js";

export class SettingsView {
  private statsManager: StatsManager;
  private navigate: (path: string) => void;

  constructor(statsManager: StatsManager, navigate: (path: string) => void) {
    this.statsManager = statsManager;
    this.navigate = navigate;
  }

  async render(): Promise<string> {
    const currentUser = await this.statsManager.fetchCurrentUser();
    if (!currentUser) {
      this.navigate("/");
      return "<div>Please log in to access settings</div>";
    }

    return renderSettingsPage(
      currentUser.username,
      currentUser.email
    );
  }

  async setup(): Promise<void> {
    const currentUser = await this.statsManager.fetchCurrentUser();
    if (!currentUser) {
      this.navigate("/");
      return;
    }

    setupSettingsPage(
      async (updates) => {
        try {
          // Call backend API to update user settings
          const sessionToken = localStorage.getItem("sessionToken");
          if (!sessionToken) {
            throw new Error("No session token found");
          }

          const response = await fetch("http://localhost:4000/profile/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to update profile");
          }

          // Update local state
          if (updates.username) {
            currentUser.username = updates.username;
          }
          if (updates.email) {
            currentUser.email = updates.email;
          }

          // Navigate back to welcome page after successful update
          this.navigate("/");
        } catch (error) {
          console.error("Failed to update profile:", error);
          const errorDiv = document.getElementById("settingsError");
          if (errorDiv) {
            errorDiv.textContent = error instanceof Error ? error.message : "Failed to update profile";
          }
        }
      },
      () => {
        this.navigate("/");
      }
    );
  }
} 