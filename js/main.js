import { getAddressBalance, getAddressTransactions } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const resultsContainer = document.getElementById('search-results-container');

  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    const type = searchType.value;

    if (!query) {
      showError('Please enter a valid Bitcoin address');
      return;
    }

    try {
      showLoading();
      
      if (type === 'address') {
        const [balance, txs] = await Promise.all([
          getAddressBalance(query),
          getAddressTransactions(query)
        ]);
        displayAddressResults(query, balance, txs);
      }
      // Aggiungi qui altri casi per tx e block...
      
    } catch (error) {
      showError('Failed to fetch data: ' + error.message);
    }
  });

  function showLoading() {
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <p>Loading blockchain data...</p>
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

  function displayAddressResults(address, balance, txs) {
    const received = txs.reduce((sum, tx) => {
      return sum + tx.vout.reduce((txSum, output) => {
        return output.scriptpubkey_address === address ? txSum + output.value : txSum;
      }, 0);
    }, 0) / 100000000;

    const sent = txs.reduce((sum, tx) => {
      return sum + tx.vin.reduce((txSum, input) => {
        return input.prevout?.scriptpubkey_address === address ? txSum + input.prevout.value : txSum;
      }, 0);
    }, 0) / 100000000;

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
            <span class="value">${balance.toFixed(8)} BTC</span>
          </div>
          <div class="address-row">
            <span class="label">Total Received:</span>
            <span class="value">${received.toFixed(8)} BTC</span>
          </div>
          <div class="address-row">
            <span class="label">Total Sent:</span>
            <span class="value">${sent.toFixed(8)} BTC</span>
          </div>
        </div>
        <div class="transactions">
          <h3>Recent Transactions (${txs.length})</h3>
          <div class="tx-list">
            ${txs.slice(0, 10).map(tx => `
              <div class="tx-item">
                <a href="https://blockstream.info/tx/${tx.txid}" target="_blank" class="tx-link">
                  ${tx.txid.substring(0, 20)}...
                </a>
                <span class="tx-value ${calculateTxAmount(tx, address) > 0 ? 'positive' : 'negative'}">
                  ${calculateTxAmount(tx, address) > 0 ? '+' : ''}${calculateTxAmount(tx, address)} BTC
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function calculateTxAmount(tx, address) {
    let amount = 0;
    tx.vout.forEach(output => {
      if (output.scriptpubkey_address === address) amount += output.value;
    });
    tx.vin.forEach(input => {
      if (input.prevout?.scriptpubkey_address === address) amount -= input.prevout.value;
    });
    return (amount / 100000000).toFixed(8);
  }
});
