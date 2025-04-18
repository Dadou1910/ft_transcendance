// Defines the structure of a route
interface Route {
  path: string;
  render: () => string;
}

// Manages client-side routing for the application
export class Router {
  // Stores registered routes
  private routes: Route[] = [];
  // DOM element to render route content
  private appContainer: HTMLElement;
  // Optional callback to execute after rendering
  private afterRenderCallback: (() => void) | null = null;

  // Initializes the router with a container ID and optional callback
  constructor(appContainerId: string, afterRenderCallback?: () => void) {
    this.appContainer = document.getElementById(appContainerId) as HTMLElement;
    this.afterRenderCallback = afterRenderCallback || null;
    // Handle browser back/forward navigation
    window.addEventListener("popstate", () => {
      console.log("Popstate event, handling route change");
      this.handleRouteChange();
    });
  }

  // Adds a new route to the router
  addRoute(path: string, render: () => string) {
    this.routes.push({ path, render });
  }

  // Navigates to a specified path
  navigate(path: string) {
    console.log("Navigating to:", path);
    history.pushState({}, "", path);
    this.handleRouteChange();
  }

  // Handles route changes and renders the appropriate content
  handleRouteChange() {
    let path = window.location.pathname;
    console.log("Handling route change, path:", path);
    // Default to root path if none provided
    if (!path || path === "/") {
      path = "/";
    }
    const route = this.routes.find((r) => r.path === path);
    if (route) {
      console.log("Rendering route:", route.path);
      this.appContainer.innerHTML = route.render();
      // Execute callback if provided
      if (this.afterRenderCallback) {
        this.afterRenderCallback();
      }
    } else {
      console.log("Route not found, redirecting to /");
      this.navigate("/");
    }
  }

  // Starts the router and initializes the first route
  start() {
    if (!window.location.pathname || window.location.pathname === "/") {
      history.replaceState({}, "", "/");
    }
    console.log("Starting router, initial path:", window.location.pathname);
    this.handleRouteChange();
  }
}