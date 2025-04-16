interface Route {
    path: string;
    render: () => string;
  }
  
  export class Router {
    private routes: Route[] = [];
    private appContainer: HTMLElement;
    private afterRenderCallback: (() => void) | null = null;
  
    constructor(appContainerId: string, afterRenderCallback?: () => void) {
      this.appContainer = document.getElementById(appContainerId) as HTMLElement;
      this.afterRenderCallback = afterRenderCallback || null;
      window.addEventListener("popstate", () => {
        console.log("Popstate event, handling route change");
        this.handleRouteChange();
      });
    }
  
    addRoute(path: string, render: () => string) {
      this.routes.push({ path, render });
    }
  
    navigate(path: string) {
      console.log("Navigating to:", path);
      history.pushState({}, "", path);
      this.handleRouteChange();
    }
  
    handleRouteChange() {
      let path = window.location.pathname;
      console.log("Handling route change, path:", path);
      if (!path || path === "/") {
        path = "/";
      }
      const route = this.routes.find((r) => r.path === path);
      if (route) {
        console.log("Rendering route:", route.path);
        this.appContainer.innerHTML = route.render();
        if (this.afterRenderCallback) {
          this.afterRenderCallback(); // Call setup listeners after rendering
        }
      } else {
        console.log("Route not found, redirecting to /");
        this.navigate("/");
      }
    }
  
    start() {
      if (!window.location.pathname || window.location.pathname === "/") {
        history.replaceState({}, "", "/");
      }
      console.log("Starting router, initial path:", window.location.pathname);
      this.handleRouteChange();
    }
  }