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
    // Gestione click su link interni
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
        } else {
          alert('Input non valido');
        }
      });
    }

    // Gestione back/forward del browser
    window.addEventListener('popstate', () => this.loadPage(window.location.pathname));

    // Carica la pagina iniziale
    this.loadPage(window.location.pathname);
  }

  navigateTo(path) {
    history.pushState(null, null, path);
    this.loadPage(path);
  }

  loadPage(path) {
    const routeKeys = Object.keys(this.routes);
    let matchedRoute = null;
    let params = {};

    for (const route of routeKeys) {
      const routeParts = route.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) continue;

      let match = true;
      let routeParams = {};

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].substring(1);
          routeParams[paramName] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        matchedRoute = this.routes[route];
        params = routeParams;
        break;
      }
    }

    if (matchedRoute) {
      this.renderPage(matchedRoute, params);
    } else {
      this.renderPage('404');
    }
  }

  renderPage(page, params = {}) {
    fetch(`${page}.html`)
      .then(res => {
        if (!res.ok) throw new Error("Pagina non trovata");
        return res.text();
      })
      .then(html => {
        document.getElementById('app').innerHTML = html;
        // Puoi eseguire script aggiuntivi qui se necessario
      })
      .catch(err => {
        console.error(err);
        document.getElementById('app').innerHTML = "<h1>Pagina non trovata</h1>";
      });
  }

  validateBitcoinAddress(address) {
    const regex = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
    return regex.test(address);
  }
}

// Inizializza il router
new Router();
