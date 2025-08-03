export async function searchBlockchain(type, query) {
  const API_BASE = 'https://blockstream.info/api';
  const endpoints = {
    tx: `${API_BASE}/tx/${query}`,
    address: `${API_BASE}/address/${query}`,
    block: `${API_BASE}/block/${query}`
  };

  try {
    const response = await fetch(endpoints[type]);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch data from blockchain');
  }
}
