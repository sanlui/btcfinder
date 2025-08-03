export async function getAddressTransactions(address) {
  try {
    const response = await fetch(`https://blockstream.info/api/address/${address}/txs`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export async function getAddressBalance(address) {
  try {
    const response = await fetch(`https://blockstream.info/api/address/${address}`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    const data = await response.json();
    return (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}
