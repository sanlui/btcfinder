export async function searchBlockchain(type, query) {
  const API_BASE = 'https://blockstream.info/api';
  const endpoints = {
    tx: `${API_BASE}/tx/${query}`,
    address: `${API_BASE}/address/${query}`,
    block: `${API_BASE}/block/${query}`
  };

  console.log(`Fetching from: ${endpoints[type]}`); // Debug

  try {
    const response = await fetch(endpoints[type]);
    console.log('API response status:', response.status); // Debug
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API data received:', data); // Debug
    return data;
  } catch (error) {
    console.error('API fetch error:', error); // Debug
    throw new Error('Failed to fetch blockchain data. Please try again later.');
  }
}
