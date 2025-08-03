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
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href'));
      }
    });

    window.addEventListener('popstate', () => this.loadPage(window.location.pathname));
    this.loadPage(window.location.pathname);
  }

  navigateTo(path) {
    window.history.pushState({}, '', path);
    this.loadPage(path);
  }

  async loadPage(path) {
    const page = this.routes[path] || 'home';
    
    try {
      const response = await fetch(`/${page}.html`);
      if (!response.ok) throw new Error('Page not found');
      
      const html = await response.text();
      document.getElementById('main-content').innerHTML = html;
      document.title = `BTC Finder | ${page.toUpperCase()}`;
      this.updateActiveLink(path);
      
      // Load page-specific JS if exists
      if (page !== 'home') {
        await this.loadScript(`js/${page}.js`);
      }
    } catch (error) {
      console.error('Error:', error);
      this.showError();
    }
  }

  async loadScript(src) {
    try {
      const response = await fetch(src);
      if (response.ok) {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'module';
        document.body.appendChild(script);
      }
    } catch (error) {
      console.log(`Script ${src} not found, skipping`);
    }
  }

  updateActiveLink(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === path);
    });
  }

  showError() {
    document.getElementById('main-content').innerHTML = `
      <div class="error">
        <h2>Page Loading Error</h2>
        <p>Could not load the requested page.</p>
        <a href="/">Return to Home</a>
      </div>
    `;
  }
}

// Initialize router
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('main-content')) {
    new Router();
  }
});
