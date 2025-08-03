const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-proxy-server.herokuapp.com/api' 
  : 'http://localhost:3001/api';

async function fetchAddressData(address) {
  const response = await fetch(`${API_BASE}/address/${address}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
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
          addr: input.prev_out?.addr || 'Coinbase',
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
