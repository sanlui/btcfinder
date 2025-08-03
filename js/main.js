import { 
  fetchAddressData, 
  fetchTransactionData, 
  fetchBlockData, 
  currentBlockHeight,
  updateCurrentBlockHeight
} from './js/api.js';

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

    if (type === 'address') {
      const data = await fetchAddressData(query);
      displayAddressData(data);
    } else if (type === 'transaction') {
      const data = await fetchTransactionData(query);
      displayTransactionData(data);
    } else if (type === 'block') {
      const data = await fetchBlockData(query);
      displayBlockData(data);
    }

    clearTimeout(timeoutId);
  } catch (error) {
    console.error("Search error:", error);
    resultsContainer.innerHTML = `
      <div class="error-message">
        ${error.message.includes('load') ? 
          'Server overloaded. Please try again later.' : 
          'Network error. Check your connection.'}
      </div>
    `;
  }
}

// Visualizza i dati di un indirizzo
function displayAddressData(data) {
  const addressResults = document.getElementById('address-results-template').cloneNode(true);
  addressResults.id = '';

  addressResults.querySelector('#address-hash').textContent = data.address;
  addressResults.querySelector('#address-balance').textContent = `${data.final_balance} BTC`;
  addressResults.querySelector('#total-transactions').textContent = data.n_tx;
  addressResults.querySelector('#total-received').textContent = `${data.total_received} BTC`;
  addressResults.querySelector('#total-sent').textContent = `${data.total_sent} BTC`;
  addressResults.querySelector('#final-balance').textContent = `${data.final_balance} BTC`;
  addressResults.querySelector('#transactions-count').textContent = `${data.txs.length} transazioni`;

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
            <div class="tx-amount out">-${input.prev_out.value} BTC</div>
          `).join('')}
        </div>
        <div class="tx-io-box">
          <div class="stat-title">Output</div>
          ${tx.out.map(output => `
            <div class="tx-address">${output.addr}</div>
            <div class="tx-amount">+${output.value} BTC</div>
          `).join('')}
        </div>
      </div>
      <div class="tx-confirmations">
        ${tx.block_height ? (currentBlockHeight - tx.block_height + 1) + ' conferme' : 'Non confermato'}
      </div>
    `;

    transactionsList.appendChild(txItem);
  });

  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = '';
  resultsContainer.appendChild(addressResults);
  resultsContainer.classList.remove('hidden');
}

// Visualizza i dati di una transazione
function displayTransactionData(data) {
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = `
    <div class="address-data-container">
      <div class="address-header">
        <h2>Transaction Details</h2>
        <div class="address-hash-display">${data.txid}</div>
      </div>

      <div class="address-stats-grid">
        <div class="address-stat-card">
          <div class="stat-title">Block Height</div>
          <div class="stat-value">${data.status?.block_height || 'Unconfirmed'}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Size</div>
          <div class="stat-value">${data.size} bytes</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Fee</div>
          <div class="stat-value">${data.fee} BTC</div>
        </div>
      </div>

      <div class="transactions-section">
        <h3>Transaction I/O</h3>
        <div class="tx-details-grid">
          <div class="tx-io-box">
            <h4>Inputs (${data.inputs.length})</h4>
            ${data.inputs.map(input => `
              <div class="tx-address">${input.prev_out?.addr || 'Coinbase'}</div>
              <div class="tx-amount out">${input.prev_out ? input.prev_out.value + ' BTC' : 'Coinbase'}</div>
            `).join('')}
          </div>
          <div class="tx-io-box">
            <h4>Outputs (${data.out.length})</h4>
            ${data.out.map(output => `
              <div class="tx-address">${output.addr}</div>
              <div class="tx-amount">${output.value} BTC</div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Visualizza i dati di un blocco
function displayBlockData(data) {
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = `
    <div class="address-data-container">
      <div class="address-header">
        <h2>Block Details</h2>
        <div class="address-hash-display">${data.id}</div>
      </div>

      <div class="address-stats-grid">
        <div class="address-stat-card">
          <div class="stat-title">Height</div>
          <div class="stat-value">${data.height}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Timestamp</div>
          <div class="stat-value">${data.formattedTime}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Transactions</div>
          <div class="stat-value">${data.tx?.length || 0}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Size</div>
          <div class="stat-value">${data.size} bytes</div>
        </div>
      </div>

      <div class="transactions-section">
        <h3>Block Transactions</h3>
        <ul class="transaction-list">
          ${data.tx.slice(0, 20).map(tx => `
            <li class="transaction-item">
              <a href="#${tx.txid}" class="tx-hash-link">${tx.txid}</a>
            </li>
          `).join('')}
          ${data.tx.length > 20 ? `<li>... and ${data.tx.length - 20} more transactions</li>` : ''}
        </ul>
      </div>
    </div>
  `;
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchType = document.getElementById('search-type').value;
    const searchQuery = document.getElementById('search-input').value.trim();

    if (searchQuery) {
      await searchBlockchain(searchType, searchQuery);
    }
  });

  updateCurrentBlockHeight();
});
