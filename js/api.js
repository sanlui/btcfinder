export async function fetchAddressData(address) {
  const [txsResponse, statsResponse] = await Promise.all([
    fetch(`https://blockstream.info/api/address/${address}/txs`),
    fetch(`https://blockstream.info/api/address/${address}`)
  ]);
  
  if (!txsResponse.ok || !statsResponse.ok) {
    throw new Error('Failed to fetch address data');
  }
  
  const txs = await txsResponse.json();
  const chain_stats = await statsResponse.json();
  
  return { txs, chain_stats };
}
