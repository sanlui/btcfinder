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
    const self = this;

    // Navigazione tramite link
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        self.navigateTo(link.getAttribute('href'));
      }
    });

    // Gestione form di ricerca
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        const type = document.getElementById('search-type').value;

        if (type === 'address' && self.validateBitcoinAddress(query)) {
          self.navigateTo(`/address/${query}`);
        } else if (type === 'transaction') {
          self.navigateTo(`/tx/${query}`);
        } else if (type === 'block') {
          self.navigateTo(`/block/${query}`);
        } else {
          alert("Input non valido o mancante.");
        }
      });
    }

    // Navigazione tramite pulsanti del browser
    window.addEventListener('popstate', () => self.loadPage(window.location.pathname));

    // Caricamento iniziale
    self.loadPage(window.location.pathname);
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
        const appContainer = document.getElementById('app');
        if (appContainer) {
          appContainer.innerHTML = html;
        } else {
          console.error("Elemento #app non trovato nell'HTML.");
        }
      })
      .catch(err => {
        console.error(err);
        const appContainer = document.getElementById('app');
        if (appContainer) {
          appContainer.innerHTML = "<h1>404 - Pagina non trovata</h1>";
        }
      });
  }

  validateBitcoinAddress(address) {
    const regex = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i;
    return regex.test(address);
  }
}

// Avvia il router
new Router();
