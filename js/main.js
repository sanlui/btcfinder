import { fetchAddressData } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results-container');

  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const address = searchInput.value.trim();
    
    if (!address) {
      showError('Please enter a Bitcoin address');
      return;
    }

    try {
      showLoading();
      const data = await fetchAddressData(address);
      displayAddressData(address, data);
    } catch (error) {
      showError('Failed to fetch address data');
    }
  });

  function showLoading() {
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <p>Loading address data...</p>
      </div>
    `;
    resultsContainer.classList.remove('hidden');
  }

  function showError(message) {
    resultsContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
      </div>
    `;
    resultsContainer.classList.remove('hidden');
  }

  function displayAddressData(address, data) {
    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;
    
    resultsContainer.innerHTML = `
      <div class="address-details">
        <h2>Address Details</h2>
        <div class="address-info">
          <div class="address-row">
            <span class="label">Address:</span>
            <span class="value monospace">${address}</span>
          </div>
          <div class="address-row">
            <span class="label">Balance:</span>
            <span class="value">${balance} BTC</span>
          </div>
        </div>
        <div class="transactions">
          <h3>Transactions</h3>
          <div class="tx-list">
            ${data.txs.map(tx => `
              <div class="tx-item">
                <a href="#" class="tx-link" data-txid="${tx.txid}">
                  ${tx.txid.substring(0, 20)}...
                </a>
                <span class="tx-value">${calculateTxAmount(tx, address)} BTC</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function calculateTxAmount(tx, address) {
    let amount = 0;
    
    // Check outputs (received)
    tx.vout.forEach(output => {
      if (output.scriptpubkey_address === address) {
        amount += output.value;
      }
    });
    
    // Check inputs (sent)
    tx.vin.forEach(input => {
      if (input.prevout?.scriptpubkey_address === address) {
        amount -= input.prevout.value;
      }
    });
    
    return (amount / 100000000).toFixed(8);
  }
});
