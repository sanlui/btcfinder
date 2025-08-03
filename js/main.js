import { searchBlockchain } from './api.js';

// Esporta le funzioni di utilità per poterle usare altrove
export function validateBitcoinAddress(address) {
  const regex = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
  return regex.test(address);
}

export function showLoading(button) {
  button.disabled = true;
  button.innerHTML = `<span class="loader-btn"></span> SEARCHING...`;
}

export function hideLoading(button) {
  button.disabled = false;
  button.textContent = 'SEARCH';
}

export function showError(container, message) {
  container.innerHTML = `
    <div class="error-message">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h4>ERROR</h4>
      <p>${message}</p>
      <button onclick="window.location.reload()" class="btn">TRY AGAIN</button>
    </div>
  `;
}

export function displayResults(container, type, query, data) {
  console.log('Displaying results for:', { type, query });
  container.innerHTML = `
    <div class="search-results fade-in">
      <h3>${type.toUpperCase()} RESULTS</h3>
      <div class="result-card">
        <h4>${query}</h4>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  `;
}

// Funzione principale per inizializzare la ricerca
export function initSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const searchBtn = document.getElementById('search-btn');
  const resultsContainer = document.getElementById('search-results-container');

  if (!searchForm || !resultsContainer) {
    console.warn('Elementi di ricerca non trovati');
    return;
  }

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    const type = searchType.value;

    if (!query) {
      showError(resultsContainer, 'Please enter a search term');
      return;
    }

    if (type === 'address' && !validateBitcoinAddress(query)) {
      showError(resultsContainer, 'Invalid Bitcoin address format');
      return;
    }

    showLoading(searchBtn);

    try {
      const result = await searchBlockchain(type, query);
      
      if (!result) {
        throw new Error('No data returned from API');
      }
      
      displayResults(resultsContainer, type, query, result);
    } catch (error) {
      console.error('Search error:', error);
      showError(resultsContainer, error.message);
    } finally {
      hideLoading(searchBtn);
    }
  });
}

// Inizializzazione della home page
export default function initHomePage() {
  initSearch();
  // Altre inizializzazioni specifiche della home
}

// Solo per debug - rimuovi in produzione
document.addEventListener('DOMContentLoaded', () => {
  console.log('Home page initialized');
});
