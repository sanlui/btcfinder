export async function searchBlockchain(type, query) {
  const API_BASE = 'https://blockstream.info/api';
  
  try {
    let url;
    switch(type) {
      case 'address':
        url = `${API_BASE}/address/${query}`;
        break;
      case 'tx':
        url = `${API_BASE}/tx/${query}`;
        break;
      case 'block':
        url = `${API_BASE}/block/${query}`;
        break;
      default:
        throw new Error('Invalid search type');
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
