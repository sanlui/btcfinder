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
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  
  safeUrl(url) {
    try {
      const parsed = new URL(url);
      if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }
};

// API Service con retry logic
const apiService = {
  async fetchWithRetry(url, options = {}, retries = 3) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  },
  
  async getTransaction(txid) {
    const [tx, status] = await Promise.all([
      this.fetchWithRetry(`https://blockstream.info/api/tx/${txid}`),
      this.fetchWithRetry(`https://blockstream.info/api/tx/${txid}/status`)
    ]);
    return { ...tx, status };
  },
  
  // Altre API methods...
};

// Web Worker per operazioni pesanti
const worker = new Worker('js/worker.js');

// Inizializzazione dell'app
document.addEventListener('DOMContentLoaded', () => {
  // Gestione errori globale
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('An unexpected error occurred', 'error');
  });
  
  // Service Worker per PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
});

// ESportazioni per i moduli
export { createCache, security, apiService };
