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
      const navLink = e.target.closest('.nav-link');
      if (navLink) {
        e.preventDefault();
        this.navigateTo(navLink.getAttribute('href'));
      }
    });

    // Gestione pulsanti indietro/avanti
    window.addEventListener('popstate', () => {
      this.loadContent(window.location.pathname);
    });

    // Caricamento iniziale
    this.handleInitialLoad();
  }

  async handleInitialLoad() {
    const path = window.location.pathname;
    // Se siamo nella root o il path non è riconosciuto, carica home
    if (path === '/' || !this.routes[path]) {
      await this.loadContent('/');
    } else {
      await this.loadContent(path);
    }
  }

  navigateTo(path) {
    // Normalizza il path rimuovendo eventuali slash multipli
    path = path.replace(/\/+/g, '/');
    
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
      // Aggiungi cache-busting per sviluppo
      const cacheBuster = window.location.hostname === 'localhost' ? `?t=${Date.now()}` : '';
      const response = await fetch(`pages/${page}.html${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Verifica che il contenuto non sia vuoto
      if (!html.trim()) {
        throw new Error('Empty page content');
      }
      
      mainContent.innerHTML = html;
      this.updateActiveLink(page);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Carica gli script specifici della pagina se necessario
      this.loadPageScript(page);
      
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError(mainContent, page, error);
    }
  }

  loadPageScript(page) {
    // Carica script specifici per la pagina
    if (page === 'home') {
      const existingScript = document.querySelector('script[src="js/main.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'js/main.js';
        script.type = 'module';
        document.body.appendChild(script);
      }
    }
  }

  showError(container, page, error) {
    container.innerHTML = `
      <section class="error-section" style="padding: 2rem; text-align: center;">
        <h2 style="color: var(--error);">Page Loading Error</h2>
        <p>Could not load ${page} page.</p>
        ${window.location.hostname === 'localhost' ? 
          `<pre style="color: #666; font-size: 0.9rem;">${error.message}</pre>` : ''}
        <a href="/" style="
          display: inline-block;
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: var(--btc-orange);
          color: white;
          text-decoration: none;
          border-radius: 4px;
        ">Return to Home</a>
      </section>
    `;
  }

  updateActiveLink(currentPage) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === currentPage);
    });
  }
}

// Inizializza il router solo se esiste l'elemento main-content
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('main-content')) {
    new Router();
  }
});
