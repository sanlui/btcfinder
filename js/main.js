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
      showError('Failed to fetch data. Please try again.');
    }
  });

  function showLoading() {
    resultsContainer.innerHTML = `
      <div class="status-message">
        <div class="loader"></div>
        <p>Searching blockchain...</p>
      </div>
    `;
    resultsContainer.classList.remove('hidden');
  }

  function showError(message) {
    resultsContainer.innerHTML = `
      <div class="status-message error-message">
        <p>${message}</p>
      </div>
    `;
    resultsContainer.classList.remove('hidden');
  }

  function displayAddressData(address, data) {
    const received = data.chain_stats.funded_txo_sum / 100000000;
    const sent = data.chain_stats.spent_txo_sum / 100000000;
    const balance = (received - sent).toFixed(8);
    
    resultsContainer.innerHTML = `
      <div class="address-details">
        <h2><span class="badge">ADDRESS</span> DETAILS</h2>
        
        <div class="address-info">
          <div class="address-info-row">
            <div class="address-label">Address:</div>
            <div class="address-value monospace">${address}</div>
          </div>
          <div class="address-info-row">
            <div class="address-label">Balance:</div>
            <div class="address-value">${balance} BTC</div>
          </div>
        </div>
        
        <div class="transactions-section">
          <h3><span class="badge">TRANSACTIONS</span> (${data.txs.length})</h3>
          <ul class="transaction-list">
            ${data.txs.slice(0, 25).map(tx => {
              const amount = calculateTxAmount(tx, address);
              return `
              <li class="transaction-item tx-${amount > 0 ? 'incoming' : 'outgoing'}">
                <div class="transaction-direction">
                  ${amount > 0 ? '↓' : '↑'}
                </div>
                <a href="https://blockstream.info/tx/${tx.txid}" 
                   target="_blank" 
                   class="transaction-hash">
                  ${tx.txid.substring(0, 20)}...
                </a>
                <div class="transaction-amount">
                  ${amount > 0 ? '+' : ''}${amount} BTC
                </div>
              </li>
              `;
            }).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function calculateTxAmount(tx, address) {
    let amount = 0;
    
    // Outputs (received)
    tx.vout.forEach(output => {
      if (output.scriptpubkey_address === address) {
        amount += output.value;
      }
    });
    
    // Inputs (sent)
    tx.vin.forEach(input => {
      if (input.prevout?.scriptpubkey_address === address) {
        amount -= input.prevout.value;
      }
    });
    
    return (amount / 100000000).toFixed(8);
  }
});
