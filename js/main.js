// Configurazione per GitHub Pages
const BASE_PATH = '/bitcoin-explorer/';
const API_ENDPOINTS = {
  tx: id => `https://blockstream.info/api/tx/${id}`,
  address: id => `https://blockstream.info/api/address/${id}`,
  block: id => isNaN(id) 
    ? `https://blockstream.info/api/block/${id}`
    : `https://blockstream.info/api/block-height/${id}`
};

// Cache con memoization e size limit
const createCache = (maxSize = 100) => {
  const data = new Map();
  const timers = new Map();

  return {
    get(key) {
      if (data.has(key)) {
        const entry = data.get(key);
        // Aggiorna LRU
        data.delete(key);
        data.set(key, entry);
        return entry.value;
      }
      return null;
    },
    
    set(key, value, ttl = 300000) {
      if (data.size >= maxSize) {
        const oldestKey = data.keys().next().value;
        this.delete(oldestKey);
      }
      
      data.set(key, { value, timestamp: Date.now() });
      
      if (ttl) {
        timers.set(key, setTimeout(() => this.delete(key), ttl);
      }
    },
    
    delete(key) {
      data.delete(key);
      clearTimeout(timers.get(key));
      timers.delete(key);
    },
    
    clear() {
      data.clear();
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    }
  };
};

// Modulo di sicurezza migliorato
const security = {
  sanitize(input) {
    if (input == null) return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  
  safeUrl(url) {
    try {
      if (!url) return '';
      const sanitized = String(url).replace(/javascript:/gi, '');
      return encodeURI(sanitized);
    } catch {
      return '';
    }
  }
};

// API Service con retry logic e CORS proxy
const apiService = {
  async fetchWithRetry(url, options = {}, retries = 3) {
    try {
      // Usa proxy CORS solo se necessario (per GitHub Pages)
      const useProxy = !window.location.hostname.includes('localhost');
      const targetUrl = useProxy 
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        : url;
      
      const response = await fetch(targetUrl, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return useProxy ? JSON.parse(data.contents) : data;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`API request failed: ${error.message}`);
    }
  },
  
  async getTransaction(txid) {
    try {
      const [tx, status] = await Promise.all([
        this.fetchWithRetry(API_ENDPOINTS.tx(txid)),
        this.fetchWithRetry(`${API_ENDPOINTS.tx(txid)}/status`)
      ]);
      return { ...tx, status };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  },
  
  async getAddress(address) {
    try {
      const [info, txs] = await Promise.all([
        this.fetchWithRetry(API_ENDPOINTS.address(address)),
        this.fetchWithRetry(`${API_ENDPOINTS.address(address)}/txs`)
      ]);
      return { info, txs };
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  },
  
  async getBlock(blockId) {
    try {
      let blockHash = blockId;
      
      if (!isNaN(blockId)) {
        blockHash = await this.fetchWithRetry(API_ENDPOINTS.block(blockId));
      }
      
      const [block, txs] = await Promise.all([
        this.fetchWithRetry(API_ENDPOINTS.block(blockHash)),
        this.fetchWithRetry(`${API_ENDPOINTS.block(blockHash)}/txs`)
      ]);
      
      return { block, txs, blockHash };
    } catch (error) {
      console.error('Error fetching block:', error);
      throw error;
    }
  }
};

// Gestione degli errori e UI
const ui = {
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = security.sanitize(message);
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  showLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'app-loader';
    document.getElementById('result').appendChild(loader);
  },
  
  hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) loader.remove();
  }
};

// Inizializzazione dell'app
document.addEventListener('DOMContentLoaded', () => {
  // Gestione errori globale
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ui.showToast('An unexpected error occurred', 'error');
  });
  
  // Service Worker per PWA
  if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    navigator.serviceWorker.register(`${BASE_PATH}sw.js`)
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
  
  // Gestione del form di ricerca
  document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('searchType').value;
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
      ui.showToast('Please enter a valid search term', 'error');
      return;
    }
    
    try {
      ui.showLoader();
      
      let data;
      switch (type) {
        case 'tx':
          data = await apiService.getTransaction(query);
          break;
        case 'address':
          data = await apiService.getAddress(query);
          break;
        case 'block':
          data = await apiService.getBlock(query);
          break;
        default:
          throw new Error('Invalid search type');
      }
      
      renderResult(type, data, query);
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.hideLoader();
    }
  });
});

// Funzione per renderizzare i risultati
function renderResult(type, data, query) {
  const resultDiv = document.getElementById('result');
  // Qui implementerai la logica di rendering specifica
  // basata sul tipo di risultato (tx, address, block)
}

// Esportazioni per i moduli
export { createCache, security, apiService, ui };
