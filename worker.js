// Worker per elaborazioni pesanti
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'processTransactions':
      const result = processTransactions(data);
      self.postMessage({ type: 'result', data: result });
      break;
      
    // Altri casi...
  }
});

function processTransactions(txs) {
  // Elaborazione complessa dei dati
  return txs.map(tx => ({
    ...tx,
    formattedValue: (tx.value / 1e8).toFixed(8)
  }));
}
