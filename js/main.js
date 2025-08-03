import { searchBlockchain } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const resultsContainer = document.getElementById('search-results-container');
  const searchSection = document.querySelector('.search-section');
  const featuresSection = document.querySelector('.features');

  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    const type = searchType.value;

    if (!query) {
      showError('Please enter a valid search term');
      return;
    }

    try {
      showLoading();
      const data = await searchBlockchain(type, query);
      displayResults(data, type, query);
    } catch (error) {
      showError(error.message || 'Search failed');
    }
  });

  function showLoading() {
    searchSection.style.display = 'none';
    featuresSection.style.display = 'none';
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <p>Searching blockchain...</p>
      </div>
    `;
  }

  function showError(message) {
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
      </div>
    `;
  }

  function displayResults(data, type, query) {
    let html = '';
    
    if (type === 'address') {
      html = `
        <div class="address-details">
          <h2>Address: ${query}</h2>
          <div class="address-info">
            <div class="address-info-row">
              <div class="address-label">Confirmed Balance:</div>
              <div class="address-value">${(data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000} BTC</div>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'tx') {
      html = `
        <div class="transaction-details">
          <h2>Transaction: ${query}</h2>
          <div class="transaction-info">
            <p>Status: Confirmed</p>
          </div>
        </div>
      `;
    } else if (type === 'block') {
      html = `
        <div class="block-details">
          <h2>Block: ${query}</h2>
          <div class="block-info">
            <p>Height: ${data.height}</p>
          </div>
        </div>
      `;
    }

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
  }
});
