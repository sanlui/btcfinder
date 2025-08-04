// Import API functions (adjust path as needed)
import { 
  fetchAddressData, 
  fetchTransactionData, 
  fetchBlockData,
  updateCurrentBlockHeight
} from './api.js';

// Global variable for current block height
let currentBlockHeight = 0;

// Mostra stato "caricamento"
function showLoadingState(container) {
  container.innerHTML = '<div class="status-message"><div class="loader"></div><p>Searching blockchain...</p></div>';
  container.classList.remove('hidden');
}

// Mostra stato errore
function showErrorState(container, error) {
  container.innerHTML = `<div class="error-message">Error: ${error.message || 'Unknown error'}</div>`;
}

// Funzione principale per la ricerca
async function searchBlockchain(type, query) {
  const resultsContainer = document.getElementById('search-results-container');
  showLoadingState(resultsContainer);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Update block height before searching
    currentBlockHeight = await updateCurrentBlockHeight();

    if (type === 'address') {
      const data = await fetchAddressData(query, controller.signal);
      displayAddressData(data);
    } else if (type === 'tx') {  // Changed from 'transaction' to 'tx'
      const data = await fetchTransactionData(query, controller.signal);
      displayTransactionData(data);
    } else if (type === 'block') {
      const data = await fetchBlockData(query, controller.signal);
      displayBlockData(data);
    }

    clearTimeout(timeoutId);
  } catch (error) {
    console.error("Search error:", error);
    showErrorState(resultsContainer, error);
  }
}

// ... rest of your display functions remain the same ...

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Form submission handler
  document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchType = document.getElementById('search-type').value;
    const searchQuery = document.getElementById('search-input').value.trim();

    if (searchQuery) {
      await searchBlockchain(searchType, searchQuery);
    }
  });

  // Initial block height update
  updateCurrentBlockHeight().then(height => {
    currentBlockHeight = height;
  });
});
