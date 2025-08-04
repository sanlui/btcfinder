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
  const [balance, txs] = await Promise.all([
    fetchWithRetry(`/address/${address}`),
    fetchWithRetry(`/address/${address}/txs`)
  ]);

  return {
    address: address,
    final_balance: (balance.chain_stats.funded_txo_sum - balance.chain_stats.spent_txo_sum) / 1e8,
    n_tx: balance.chain_stats.tx_count,
    total_received: balance.chain_stats.funded_txo_sum / 1e8,
    total_sent: balance.chain_stats.spent_txo_sum / 1e8,
    txs: txs.map(tx => ({
      hash: tx.txid,
      block_height: tx.status.block_height,
      inputs: tx.vin.map(input => ({
        prev_out: {
          addr: input.prevout?.scriptpubkey_address || 'Coinbase',
          value: (input.prevout?.value / 1e8).toFixed(8)
        }
      })),
      out: tx.vout.map(output => ({
        addr: output.scriptpubkey_address,
        value: (output.value / 1e8).toFixed(8)
      }))
    }))
  };
}

async function fetchTransactionData(txHash) {
  const data = await fetchWithRetry(`/tx/${txHash}`);
  return {
    txid: data.txid,
    size: data.size,
    fee: (data.fee / 1e8).toFixed(8),
    status: data.status,
    inputs: data.vin.map(input => ({
      prev_out: {
        addr: input.prevout?.scriptpubkey_address || 'Coinbase',
        value: (input.prevout?.value / 1e8).toFixed(8)
      }
    })),
    out: data.vout.map(output => ({
      addr: output.scriptpubkey_address,
      value: (output.value / 1e8).toFixed(8)
    }))
  };
}

async function fetchBlockData(blockHash) {
  const data = await fetchWithRetry(`/block/${blockHash}`);
  const txs = await fetchWithRetry(`/block/${blockHash}/txs`);

  return {
    id: data.id,
    height: data.height,
    timestamp: data.timestamp,
    size: data.size,
    tx_count: data.tx_count,
    formattedTime: new Date(data.timestamp * 1000).toLocaleString(),
    tx: txs
  };
}

export {
  fetchAddressData,
  fetchTransactionData,
  fetchBlockData,
  updateCurrentBlockHeight,
  currentBlockHeight
};
