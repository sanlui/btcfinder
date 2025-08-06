// Worker per elaborazioni pesanti - Versione GitHub-compatibile
const API = {
  processTxs: (txs) => {
    return txs.map(tx => ({
      ...tx,
      formattedValue: (tx.value / 1e8).toFixed(8),
      shortHash: tx.hash?.substring(0, 16) + '...' || 'unknown'
    }));
  },
  filterData: (data) => {
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    return data.filter(item => item.confirmations > 0);
  }
};

self.onmessage = async ({ data }) => {
  const { id, type, payload } = data;
  
  try {
    if (!API[type]) throw new Error(`Invalid type: ${type}`);
    const result = await API[type](payload);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ 
      id, 
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
};

// Gestione errori globale
self.addEventListener('error', (event) => {
  self.postMessage({
    id: 'system',
    error: {
      message: `Worker runtime error: ${event.message}`,
      filename: event.filename,
      lineno: event.lineno
    }
  });
});
