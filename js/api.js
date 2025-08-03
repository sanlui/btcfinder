const API_BASE = "https://blockchain.info";
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

let currentBlockHeight = 0;

// Funzione per fare richieste con ritentativi e gestione CORS
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  try {
    // Usa il proxy CORS solo se necessario (in sviluppo)
    const useProxy = window.location.hostname === 'localhost';
    const targetUrl = useProxy ? `${CORS_PROXY}${url}` : url;
    
    const response = await fetch(targetUrl, {
      headers: useProxy ? { 'X-Requested-With': 'XMLHttpRequest' } : {}
    });

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, retries - 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

// Aggiorna l'altezza del blocco
async function updateCurrentBlockHeight() {
  try {
    const data = await fetchWithRetry(`${API_BASE}/q/getblockcount`);
    currentBlockHeight = data;
    return data;
  } catch (error) {
    console.error("Error updating block height:", error);
    currentBlockHeight = await getFallbackBlockHeight();
    return currentBlockHeight;
  }
}

// Altezza di fallback da un altro endpoint
async function getFallbackBlockHeight() {
  try {
    const data = await fetchWithRetry(`${API_BASE}/latestblock`);
    return data.height;
  } catch {
    return 0; // Ultimo fallback
  }
}

// Ottieni dati indirizzo
async function fetchAddressData(address) {
  try {
    const data = await fetchWithRetry(`${API_BASE}/rawaddr/${address}?limit=50`);
    return formatAddressData(data);
  } catch (error) {
    console.error("Address fetch error:", error);
    throw new Error(`Unable to fetch address: ${error.message}`);
  }
}

// Ottieni dati transazione
async function fetchTransactionData(txHash) {
  try {
    const data = await fetchWithRetry(`${API_BASE}/rawtx/${txHash}`);
    return formatTransaction(data);
  } catch (error) {
    console.error("Transaction fetch error:", error);
    throw new Error(`Transaction not found: ${txHash}`);
  }
}

// Ottieni dati blocco
async function fetchBlockData(blockHash) {
  try {
    const data = await fetchWithRetry(`${API_BASE}/rawblock/${blockHash}`);
    return {
      ...data,
      // Formattazione aggiuntiva per i blocchi
      formattedTime: new Date(data.time * 1000).toLocaleString()
    };
  } catch (error) {
    console.error("Block fetch error:", error);
    throw new Error(`Block not found: ${blockHash}`);
  }
}

// Formattazione dati
function formatAddressData(data) {
  return {
    address: data.address,
    final_balance: (data.final_balance / 100000000).toFixed(8),
    n_tx: data.n_tx,
    total_received: (data.total_received / 100000000).toFixed(8),
    total_sent: (data.total_sent / 100000000).toFixed(8),
    txs: data.txs.map(formatTransaction)
  };
}

function formatTransaction(tx) {
  return {
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
  };
}

export {
  fetchAddressData,
  fetchTransactionData,
  fetchBlockData,
  updateCurrentBlockHeight,
  currentBlockHeight
};
