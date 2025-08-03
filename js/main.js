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
      showError(error.message || 'Failed to fetch blockchain data');
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

  async function displayResults(data, type, query) {
    let html = '';
    
    if (type === 'address') {
      // Otteniamo il saldo e le transazioni
      const balance = await getAddressBalance(query);
      const txs = await getAddressTransactions(query);
      
      html = `
        <div class="address-details">
          <h2>Address Details</h2>
          <div class="address-info">
            <div class="address-info-row">
              <div class="address-label">Address:</div>
              <div class="address-value monospace">${query}</div>
            </div>
            <div class="address-info-row">
              <div class="address-label">Balance:</div>
              <div class="address-value">${balance} BTC</div>
            </div>
          </div>
          
          <div class="transactions-section">
            <h3>Recent Transactions</h3>
            <ul class="transaction-list">
              ${txs.slice(0, 10).map(tx => `
                <li class="transaction-item">
                  <div class="tx-hash">
                    <a href="#" class="tx-link" data-txid="${tx.txid}">${tx.txid.substring(0, 20)}...</a>
                  </div>
                  <div class="tx-value">${tx.value / 100000000} BTC</div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    // Aggiungi qui altri casi per tx e block...

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
    
    // Aggiungi event listener per i link delle transazioni
    document.querySelectorAll('.tx-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const txid = e.target.getAttribute('data-txid');
        searchInput.value = txid;
        searchType.value = 'tx';
        searchForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  // Nuove funzioni helper
  async function getAddressBalance(address) {
    try {
      const response = await fetch(`https://blockstream.info/api/address/${address}`);
      const data = await response.json();
      return (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async function getAddressTransactions(address) {
    try {
      const response = await fetch(`https://blockstream.info/api/address/${address}/txs`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }
});
