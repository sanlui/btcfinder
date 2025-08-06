// Versione ottimizzata con error handling
self.addEventListener('message', ({ data }) => {
  const { id, type, payload } = data;
  
  try {
    let result;
    switch (type) {
      case 'processTxs':
        result = processTransactions(payload);
        break;
      case 'filterData':
        result = filterBlockchainData(payload);
        break;
      default:
        throw new Error('Unknown worker operation');
    }
    
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
});

function processTransactions(txs) {
  return txs.map(tx => ({
    ...tx,
    formattedValue: (tx.value / 1e8).toFixed(8),
    shortHash: tx.hash.substring(0, 16) + '...'
  }));
}

function filterBlockchainData(data) {
  // Implementa la tua logica di filtraggio
  return data.filter(item => item.confirmations > 0);
}
