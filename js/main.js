import { 
  fetchAddressData, 
  fetchTransactionData, 
  fetchBlockData, 
  updateCurrentBlockHeight,
  currentBlockHeight
} from './api.js';

function showLoadingState(container) {
  container.innerHTML = '<div class="status-message"><div class="loader"></div><p>Searching blockchain...</p></div>';
  container.classList.remove('hidden');
}

function showErrorState(container, error) {
  container.innerHTML = `
    <div class="error-message">
      ${error.message.includes('Failed to fetch') ? 
        'Network error. Please check your connection.' : 
        error.message.includes('HTTP 404') ?
        'Data not found. Please check your search query.' :
        'Error: ' + error.message}
    </div>
  `;
}

async function searchBlockchain(type, query) {
  const resultsContainer = document.getElementById('search-results-container');
  showLoadingState(resultsContainer);

  try {
    if (type === 'address') {
      const data = await fetchAddressData(query);
      displayAddressData(data);
    } else if (type === 'tx') {
      const data = await fetchTransactionData(query);
      displayTransactionData(data);
    } else if (type === 'block') {
      const data = await fetchBlockData(query);
      displayBlockData(data);
    }
  } catch (error) {
    console.error("Search error:", error);
    showErrorState(resultsContainer, error);
  }
}

function displayAddressData(data) {
  const template = document.getElementById('address-results-template');
  const addressResults = template.content.cloneNode(true).firstElementChild;

  // Format numbers with proper decimal places
  const formatBTC = (value) => (value / 1e8).toFixed(8);

  addressResults.querySelector('#address-hash').textContent = data.address;
  addressResults.querySelector('#address-balance').textContent = `${formatBTC(data.final_balance)} BTC`;
  addressResults.querySelector('#total-transactions').textContent = data.n_tx;
  addressResults.querySelector('#total-received').textContent = `${formatBTC(data.total_received)} BTC`;
  addressResults.querySelector('#total-sent').textContent = `${formatBTC(data.total_sent)} BTC`;
  addressResults.querySelector('#final-balance').textContent = `${formatBTC(data.final_balance)} BTC`;
  addressResults.querySelector('#transactions-count').textContent = `${data.txs.length} transactions`;

  const transactionsList = addressResults.querySelector('#transactions-list');
  transactionsList.innerHTML = '';

  data.txs.forEach(tx => {
    const txItem = document.createElement('li');
    txItem.className = 'transaction-item';
    
    txItem.innerHTML = `
      <a href="#${tx.hash}" class="tx-hash-link">${tx.hash}</a>
      <div class="tx-details-grid">
        <div class="tx-io-box">
          <div class="stat-title">Input</div>
          ${tx.inputs.map(input => `
            <div class="tx-address">${input.prev_out.addr}</div>
            <div class="tx-amount out">-${formatBTC(input.prev_out.value)} BTC</div>
          `).join('')}
        </div>
        <div class="tx-io-box">
          <div class="stat-title">Output</div>
          ${tx.out.map(output => `
            <div class="tx-address">${output.addr}</div>
            <div class="tx-amount">+${formatBTC(output.value)} BTC</div>
          `).join('')}
        </div>
      </div>
      <div class="tx-confirmations">
        ${tx.block_height ? (currentBlockHeight - tx.block_height + 1) + ' confirmations' : 'Unconfirmed'}
      </div>
    `;
    
    transactionsList.appendChild(txItem);
  });

  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = '';
  resultsContainer.appendChild(addressResults);
  resultsContainer.classList.remove('hidden');
}

// Le funzioni displayTransactionData e displayBlockData rimangono uguali alla tua versione originale

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
