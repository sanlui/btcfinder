class Router {
  constructor() {
    this.routes = {
      '/': 'home',
      '/tool': 'tool',
      '/api': 'api',
      '/docs': 'docs',
      '/address/:id': 'address',
      '/tx/:id': 'transaction',
      '/block/:id': 'block'
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

    // Gestione del form di ricerca
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        const type = document.getElementById('search-type').value;
        
        if (type === 'address' && this.validateBitcoinAddress(query)) {
          this.navigateTo(`/address/${query}`);
        } else if (type === 'transaction') {
          this.navigateTo(`/tx/${query}`);
        } else if (type === 'block') {
          this.navigateTo(`/block/${query}`);
        }
      });
    }

    window.addEventListener('popstate', () => this.loadPage(window.location.pathname));
    this.loadPage(window.location.pathname);
  }

  validateBitcoinAddress(address) {
    const regex = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
    return regex.test(address);
  }

  // ... (resto del codice del router rimane uguale)
}

new Router();

// Sposta tutta la logica di ricerca in un file separato (search.js)
