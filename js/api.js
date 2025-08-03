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

// ✅ Ottieni altezza corrente del blocco
async function updateCurrentBlockHeight() {
  try {
    const data = await fetchWithRetry('/blocks/tip/height');
    currentBlockHeight = parseInt(data);
    return currentBlockHeight;
  } catch (error) {
    console.warn("Errore nel recupero altezza blocco:", error.message);
    return 0;
  }
}

// ✅ Ottieni dati di un indirizzo
async function fetchAddressData(address) {
  const balance = await fetchWithRetry(`/address/${address}`);
  const txs = await fetchWithRetry(`/address/${address}/txs`);

  return {
    address: balance.address,
    final_balance: (balance.chain_stats.funded_txo_sum - balance.chain_stats.spent_txo_sum) / 1e8,
    n_tx: balance.chain_stats.tx_count,
    total_received: balance.chain_stats.funded_txo_sum / 1e8,
    total_sent: balance.chain_stats.spent_txo_sum / 1e8,
    txs: txs.map(tx => ({
      hash: tx.txid,
      block_height: tx.status.block_height || 'unconfirmed',
      inputs: tx.vin.map(input => ({
        prev_out: {
          addr: input.prevout?.scriptpubkey_address || 'Coinbase',
          value: (input.prevout?.value / 1e8).toFixed(8) || '0'
        }
      })),
      out: tx.vout.map(output => ({
        addr: output.scriptpubkey_address,
        value: (output.value / 1e8).toFixed(8)
      }))
    }))
  };
}

// ✅ Ottieni dati di una transazione
async function fetchTransactionData(txHash) {
  const data = await fetchWithRetry(`/tx/${txHash}`);
  return {
    ...data,
    fee: (data.fee / 1e8).toFixed(8),
    inputs: data.vin.map(input => ({
      prev_out: {
        addr: input.prevout?.scriptpubkey_address || 'Coinbase',
        value: (input.prevout?.value / 1e8).toFixed(8) || '0'
      }
    })),
    out: data.vout.map(output => ({
      addr: output.scriptpubkey_address,
      value: (output.value / 1e8).toFixed(8)
    }))
  };
}

// ✅ Ottieni dati di un blocco
async function fetchBlockData(blockHash) {
  const data = await fetchWithRetry(`/block/${blockHash}`);
  return {
    ...data,
    formattedTime: new Date(data.timestamp * 1000).toLocaleString()
  };
}

export {
  fetchAddressData,
  fetchTransactionData,
  fetchBlockData,
  updateCurrentBlockHeight,
  currentBlockHeight
};
