const API_BASE = "https://blockchain.info";
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;
const USE_PROXY = false; // Imposta a true se vuoi usare il proxy PHP

let currentBlockHeight = 0;

async function fetchWithRetry(endpoint, options = {}) {
  let lastError;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      let url;
      
      if (USE_PROXY) {
        url = `/proxy.php?endpoint=${encodeURIComponent(endpoint)}`;
      } else {
        url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}cors=true`;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(USE_PROXY ? {} : {'X-Requested-With': 'XMLHttpRequest'}),
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

  throw lastError || new Error('Failed to fetch data after retries');
}

// Funzioni API
async function updateCurrentBlockHeight() {
  try {
    currentBlockHeight = await fetchWithRetry('/q/getblockcount');
    return currentBlockHeight;
  } catch (error) {
    console.warn("Using fallback block height:", error.message);
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
  const data = await fetchWithRetry(`/rawaddr/${address}?limit=50`);
  return {
    address: data.address,
    final_balance: (data.final_balance / 100000000).toFixed(8),
    n_tx: data.n_tx,
    total_received: (data.total_received / 100000000).toFixed(8),
    total_sent: (data.total_sent / 100000000).toFixed(8),
    txs: data.txs.map(tx => ({
      hash: tx.hash,
      block_height: tx.block_height,
      inputs: tx.inputs.map(input => ({
        prev_out: {
          addr: input.prev_out?.addr || 'Coinbase',
          value: (input.prev_out?.value / 100000000).toFixed(8) || '0'
        }
      })),
      out: tx.out.map(output => ({
        addr: output.addr,
        value: (output.value / 100000000).toFixed(8)
      }))
    }))
  };
}

async function fetchTransactionData(txHash) {
  const data = await fetchWithRetry(`/rawtx/${txHash}`);
  return {
    ...data,
    fee: (data.fee / 100000000).toFixed(8),
    inputs: data.inputs.map(input => ({
      prev_out: {
        addr: input.prev_out?.addr || 'Coinbase',
        value: (input.prev_out?.value / 100000000).toFixed(8) || '0'
      }
    })),
    out: data.out.map(output => ({
      addr: output.addr,
      value: (output.value / 100000000).toFixed(8)
    }))
  };
}

async function fetchBlockData(blockHash) {
  const data = await fetchWithRetry(`/rawblock/${blockHash}`);
  return {
    ...data,
    formattedTime: new Date(data.time * 1000).toLocaleString()
  };
}

export {
  fetchAddressData,
  fetchTransactionData,
  fetchBlockData,
  updateCurrentBlockHeight,
  currentBlockHeight
};
