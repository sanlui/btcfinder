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
    // Gestione click sui link
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href'));
      }
    });

    // Gestione pulsanti indietro/avanti
    window.addEventListener('popstate', () => {
      this.loadPage(window.location.pathname);
    });

    // Caricamento iniziale
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
      
      // Aggiorna titolo della pagina
      document.title = `BTC Finder | ${page.toUpperCase()}`;
      
      // Aggiorna link attivo
      this.updateActiveLink(path);
      
      // Carica eventuali script solo se esistono
      this.tryLoadScript(page);
      
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError(error);
    }
  }

  async tryLoadScript(page) {
    try {
      // Verifica se il file esiste
      const response = await fetch(`/js/${page}.js`);
      if (response.ok) {
        const script = document.createElement('script');
        script.src = `/js/${page}.js`;
        script.type = 'module';
        document.body.appendChild(script);
      }
    } catch (error) {
      console.log(`No ${page}.js file found, skipping`);
    }
  }

  updateActiveLink(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === path);
    });
  }

  showError(error) {
    document.getElementById('main-content').innerHTML = `
      <div class="error-message">
        <h3>Error Loading Page</h3>
        <p>${error.message}</p>
        <a href="/">Return to Home</a>
      </div>
    `;
  }
}

// Inizializza il router
document.addEventListener('DOMContentLoaded', () => {
  new Router();
});
