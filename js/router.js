class Router {
  constructor() {
    this.routes = {
      '/': 'home',
      '/tool': 'tool',
      '/api': 'api',
      '/docs': 'docs'
    };
    this.init();
  }

  init() {
    // Handle link clicks
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href'));
      }
    });

    // Handle back/forward
    window.addEventListener('popstate', () => this.loadPage(window.location.pathname));
    
    // Initial load
    this.loadPage(window.location.pathname);
  }

  navigateTo(path) {
    window.history.pushState({}, '', path);
    this.loadPage(path);
  }

  async loadPage(path) {
    const page = this.routes[path] || 'home';
    
    try {
      // Show loading state
      document.getElementById('main-content').innerHTML = `
        <div class="loading-state">
          <div class="loader"></div>
          <p>Loading...</p>
        </div>
      `;

      const response = await fetch(`/${page}.html`);
      if (!response.ok) throw new Error('Page not found');
      
      const html = await response.text();
      document.getElementById('main-content').innerHTML = html;
      
      // Update page title
      document.title = `BTC Finder | ${page.charAt(0).toUpperCase() + page.slice(1)}`;
      
      // Update active nav link
      this.updateActiveLink(path);
      
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError();
    }
  }

  updateActiveLink(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === path);
    });
  }

  showError() {
    document.getElementById('main-content').innerHTML = `
      <div class="error-message">
        <h2>Page Loading Error</h2>
        <p>Could not load the requested page.</p>
        <a href="/" class="btn">Return to Home</a>
      </div>
    `;
  }
}

// Initialize router
document.addEventListener('DOMContentLoaded', () => {
  new Router();
});
