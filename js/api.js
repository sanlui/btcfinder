const API_BASE = "https://blockstream.info/api";
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

  throw lastError || new Error('Failed to fetch data after retries');
}

async function updateCurrentBlockHeight() {
  try {
    const data = await fetchWithRetry('/blocks/tip/height');
    currentBlockHeight = parseInt(data);
    return currentBlockHeight;
  } catch (error) {
    console.warn("Error fetching block height:", error.message);
    return 0;
  }
}

async function fetchAddressData(address) {
  const [addressData, txs] = await Promise.all([
    fetchWithRetry(`/address/${address}`),
    fetchWithRetry(`/address/${address}/txs`)
  ]);

  return {
    address: address,
    final_balance: addressData.chain_stats.funded_txo_sum - addressData.chain_stats.spent_txo_sum,
    n_tx: addressData.chain_stats.tx_count,
    total_received: addressData.chain_stats.funded_txo_sum,
    total_sent: addressData.chain_stats.spent_txo_sum,
    txs: txs.map(tx => ({
      hash: tx.txid,
      block_height: tx.status.block_height,
      inputs: tx.vin.map(input => ({
        prev_out: {
          addr: input.prevout?.scriptpubkey_address || 'Coinbase',
          value: input.prevout?.value || 0
        }
      })),
      out: tx.vout.map(output => ({
        addr: output.scriptpubkey_address,
        value: output.value
      }))
    }))
  };
}

// Le altre funzioni (fetchTransactionData e fetchBlockData) rimangono uguali alla tua versione originale

export {
  fetchAddressData,
  fetchTransactionData,
  fetchBlockData,
  updateCurrentBlockHeight,
  currentBlockHeight
};
