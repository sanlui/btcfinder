async function searchBlockchain(type, query) {
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = '<div class="status-message"><div class="loader"></div><p>Searching blockchain...</p></div>';
  resultsContainer.classList.remove('hidden');

  try {
    if (type === 'address') {
      const data = await fetchAddressData(query);
      displayAddressData(data);
    } else if (type === 'tx') {
      const data = await fetchTransactionData(query);
      displayTransactionData(data); // Dovrai implementare questa funzione
    } else if (type === 'block') {
      const data = await fetchBlockData(query);
      displayBlockData(data); // Dovrai implementare questa funzione
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    resultsContainer.innerHTML = `
      <div class="error-message">
        Error: ${error.message || 'Failed to fetch data'}
      </div>
    `;
  }
}

// Funzione per ottenere i dati di un indirizzo
async function fetchAddressData(address) {
  const response = await fetch(`https://blockchain.info/rawaddr/${address}`);
  
  if (!response.ok) {
    throw new Error('Address not found or API error');
  }
  
  const data = await response.json();
  
  // Formatta i dati come il tuo sistema si aspetta
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
          addr: input.prev_out?.addr || 'Coinbase', // Le transazioni coinbase non hanno input
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

// Esempio per transazioni (da implementare)
async function fetchTransactionData(txHash) {
  const response = await fetch(`https://blockchain.info/rawtx/${txHash}`);
  if (!response.ok) {
    throw new Error('Transaction not found');
  }
  return await response.json();
}

// Esempio per blocchi (da implementare)
async function fetchBlockData(blockHash) {
  const response = await fetch(`https://blockchain.info/rawblock/${blockHash}`);
  if (!response.ok) {
    throw new Error('Block not found');
  }
  return await response.json();
}
