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
      
      // Carica gli script specifici della pagina
      this.loadPageScript(page);
      
      // Aggiorna il menu attivo
      this.updateActiveLink(path);
      
    } catch (error) {
      console.error('Error loading page:', error);
      window.location.href = '/404.html';
    }
  }

  loadPageScript(page) {
    // Rimuovi vecchi script
    document.querySelectorAll('script[data-page]').forEach(script => {
      script.remove();
    });

    // Aggiungi nuovo script
    const script = document.createElement('script');
    script.src = `js/${page}.js`;
    script.type = 'module';
    script.setAttribute('data-page', page);
    document.body.appendChild(script);
  }

  updateActiveLink(path) {
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === path);
    });
  }
}

// Inizializza il router
document.addEventListener('DOMContentLoaded', () => {
  new Router();
});
