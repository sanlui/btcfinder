
// API Configuration
const API_ENDPOINTS = {
  blockstream: 'https://blockstream.info/api',
  mempool: 'https://mempool.space/api',
  blockchain: 'https://blockchain.info',
  coingecko: 'https://api.coingecko.com/api/v3'
};

// Cache Implementation
const cache = {
  data: {},
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (item.expiry < Date.now()) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  set(key, value, ttl = 300000) {
    this.data[key] = {
      value: value,
      expiry: Date.now() + ttl
    };
  }
};

// API Fetch with Fallback
async function fetchWithFallback(endpoint, type = 'blockstream') {
  try {
    let url;
    switch(type) {
      case 'blockstream':
        url = `${API_ENDPOINTS.blockstream}${endpoint}`;
        break;
      case 'mempool':
        url = `${API_ENDPOINTS.mempool}${endpoint}`;
        break;
      case 'blockchain':
        url = `${API_ENDPOINTS.blockchain}${endpoint}`;
        break;
      default:
        url = `${API_ENDPOINTS.blockstream}${endpoint}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.error(`Error with ${type} API:`, error);
    if (type === 'blockstream') {
      return fetchWithFallback(endpoint, 'mempool');
    } else if (type === 'mempool') {
      return fetchWithFallback(endpoint, 'blockchain');
    }
    throw error;
  }
}

// Helper Functions
function formatBTC(satoshi) {
  return (satoshi / 1e8).toFixed(8) + ' BTC';
}

function shortenHash(hash) {
  return hash.length > 20 
    ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}` 
    : hash;
}

// Export Functions
export {
  API_ENDPOINTS,
  cache,
  fetchWithFallback,
  formatBTC,
  shortenHash
};
