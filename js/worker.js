// Versione semplificata e robusta
const operations = {
  processTxs: (txs) => txs.map(tx => ({
    ...tx,
    formattedValue: (tx.value / 1e8).toFixed(8),
    shortHash: tx.hash?.substring(0, 16) + '...' || 'unknown'
  })),
  filterData: (data) => data.filter(item => item.confirmations > 0)
};

self.onmessage = ({ data: { id, type, payload } }) => {
  try {
    if (!operations[type]) throw new Error(`Invalid operation: ${type}`);
    const result = operations[type](payload);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
