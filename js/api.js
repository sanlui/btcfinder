const API_BASE = "https://blockchain.info";
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

let currentBlockHeight = 0;

async function fetchWithRetry(endpoint, options = {}) {
  let lastError;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const url = `${API_BASE}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw lastError || new Error('Unknown fetch error');
}

// Funzioni API aggiornate
async function updateCurrentBlockHeight() {
  try {
    currentBlockHeight = await fetchWithRetry('/q/getblockcount');
    return currentBlockHeight;
  } catch (error) {
    console.warn("Using fallback block height");
    currentBlockHeight = await getFallbackBlockHeight();
    return currentBlockHeight;
  }
}

async function getFallbackBlockHeight() {
  try {
    const data = await fetchWithRetry('/latestblock');
    return data?.height || 0;
  } catch {
    return 0;
  }
}

async function fetchAddressData(address) {
  try {
    const data = await fetchWithRetry(`/rawaddr/${address}?limit=50&cors=true`);
    return formatAddressData(data);
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(`Could not load address data: ${error.message}`);
  }
}

// ... (mantieni le altre funzioni fetchTransactionData, fetchBlockData, etc.)

export {
  fetchAddressData,
  fetchTransactionData,
  fetchBlockData,
  updateCurrentBlockHeight,
  currentBlockHeight
};
