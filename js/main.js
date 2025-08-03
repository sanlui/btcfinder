import { searchBlockchain } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const searchBtn = document.getElementById('search-btn');
  const resultsContainer = document.getElementById('search-results-container');

  // Debug: verifica se gli elementi esistono
  console.log('Elementi del form:', { searchForm, searchInput, searchType, searchBtn, resultsContainer });

  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted'); // Debug
      
      const query = searchInput.value.trim();
      const type = searchType.value;
      console.log('Search params:', { type, query }); // Debug

      if (!query) {
        showAlert('Please enter a search term');
        return;
      }

      // Validazione migliorata
      if (type === 'address' && !validateBitcoinAddress(query)) {
        showError('Invalid Bitcoin address format');
        return;
      }

      showLoading();

      try {
        console.log('Starting search...'); // Debug
        const result = await searchBlockchain(type, query);
        console.log('Search result:', result); // Debug
        
        if (!result) {
          throw new Error('No data returned from API');
        }
        
        displayResults(type, query, result);
      } catch (error) {
        console.error('Search error:', error); // Debug
        showError(error.message);
      } finally {
        hideLoading();
      }
    });
  }

  function validateBitcoinAddress(address) {
    const regex = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
    return regex.test(address);
  }

  function displayResults(type, query, data) {
    console.log('Displaying results...'); // Debug
    resultsContainer.innerHTML = `
      <div class="search-results fade-in">
        <h3>${type.toUpperCase()} RESULTS</h3>
        <div class="result-card">
          <h4>${query}</h4>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    `;
    console.log('Results should be visible now'); // Debug
  }

  function showLoading() {
    searchBtn.disabled = true;
    searchBtn.innerHTML = `
      <span class="loader-btn"></span> SEARCHING...
    `;
  }

  function hideLoading() {
    searchBtn.disabled = false;
    searchBtn.textContent = 'SEARCH';
  }

  function showError(message) {
    resultsContainer.innerHTML = `
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
});
