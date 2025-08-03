import { searchBlockchain } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const resultsContainer = document.getElementById('search-results-container');

  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }

  async function handleSearch(e) {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!validateInput(type, query)) return;
    
    showLoadingState();
    
    try {
      const data = await searchBlockchain(type, query);
      displayResults(type, query, data);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoadingState();
    }
  }

  function validateInput(type, query) {
    const validations = {
      tx: /^[a-fA-F0-9]{64}$/,
      address: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
      block: /^[0-9]+$|^[a-fA-F0-9]{64}$/
    };
    
    if (!validations[type].test(query)) {
      showError(`Invalid ${type} format`);
      return false;
    }
    return true;
  }

  function displayResults(type, query, data) {
    resultsContainer.innerHTML = `
      <div class="search-results fade-in">
        <h3>${type.toUpperCase()} Results</h3>
        <div class="result-card">
          <h4>${query}</h4>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  function showLoadingState() {
    searchBtn.disabled = true;
    searchBtn.innerHTML = `
      <span class="loader-btn"></span> Searching...
    `;
  }

  function hideLoadingState() {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }

  function showError(message) {
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `;
  }
});
