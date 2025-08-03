const API_PROXY = "https://cors-anywhere.herokuapp.com/";

async function fetchAddressData(address) {
  const response = await fetch(`${API_PROXY}https://blockchain.info/rawaddr/${address}?limit=50`);
  // ... resto del codice
}
let currentBlockHeight = 0;

// Funzioni API
async function updateCurrentBlockHeight() {
  try {
    const response = await fetch('https://blockchain.info/q/getblockcount');
    if (!response.ok) throw new Error('Failed to get block height');
    currentBlockHeight = await response.json();
  } catch (error) {
    console.error("Error updating block height:", error);
    currentBlockHeight = 0; // Fallback
  }
}

async function fetchAddressData(address) {
  const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=50`);
  if (!response.ok) throw new Error('Address not found');
  
  const data = await response.json();
  return formatAddressData(data);
}

async function fetchTransactionData(txHash) {
  const response = await fetch(`https://blockchain.info/rawtx/${txHash}`);
  if (!response.ok) throw new Error('Transaction not found');
  return await response.json();
}

async function fetchBlockData(blockHash) {
  const response = await fetch(`https://blockchain.info/rawblock/${blockHash}`);
  if (!response.ok) throw new Error('Block not found');
  return await response.json();
}

// Funzioni di supporto
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
