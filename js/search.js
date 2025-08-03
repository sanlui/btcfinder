import { searchBlockchain } from './api.js';

export function initSearch() {
  const resultsContainer = document.getElementById('search-results-container');
  
  if (!resultsContainer) return;

  // Mostra i risultati basati sull'URL corrente
  const path = window.location.pathname;
  const parts = path.split('/');
  
  if (parts.length > 2) {
    const type = parts[1]; // 'address', 'tx' o 'block'
    const query = parts[2];
    
    performSearch(type, query);
  }

  async function performSearch(type, query) {
    try {
      showLoading();
      const result = await searchBlockchain(type, query);
      displayResults(type, query, result);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
    }
  }

  // ... (funzioni displayResults, showLoading, etc. rimangono uguali)
}
