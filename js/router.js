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
      const navLink = e.target.closest('.nav-link');
      if (navLink) {
        e.preventDefault();
        this.navigateTo(navLink.getAttribute('href'));
      }
    });

    window.addEventListener('popstate', () => {
      this.loadContent(window.location.pathname);
    });

    // Carica il contenuto iniziale
    this.loadContent(window.location.pathname);
  }

  navigateTo(path) {
    window.history.pushState({}, '', path);
    this.loadContent(path);
    document.title = this.getPageTitle(path);
  }

  getPageTitle(path) {
    const titles = {
      '/': 'BTC Finder | Home',
      '/tool': 'BTC Finder | Tools',
      '/api': 'BTC Finder | API',
      '/docs': 'BTC Finder | Documentation'
    };
    return titles[path] || 'BTC Finder';
  }

  async loadContent(path) {
    const page = this.routes[path] || 'home';
    const mainContent = document.getElementById('main-content');
    
    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('Page not found');
      
      const html = await response.text();
      mainContent.innerHTML = html;
      this.updateActiveLink(page);
      
      // Scroll to top dopo il caricamento
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Error loading page:', error);
      mainContent.innerHTML = `
        <section class="error-section">
          <h2>Page Loading Error</h2>
          <p>Could not load the requested page. Please try again.</p>
        </section>
      `;
    }
  }

  updateActiveLink(currentPage) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === currentPage);
    });
  }
}

// Inizializza il router
new Router();
