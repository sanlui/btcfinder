import {
  API_ENDPOINTS,
  cache,
  fetchWithFallback,
  formatBTC,
  shortenHash
} from './api.js';

// DOM Elements
const searchType = document.getElementById('search-type');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsContent = document.getElementById('results-content');
const defaultState = document.getElementById('default-state');
const loadingState = document.getElementById('loading-state');

// Event Listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

// Main Search Function
async function performSearch() {
  const type = searchType.value;
  const query = searchInput.value.trim();
  
  try {
    validateInput(type, query);
    showLoadingState();
    
    if (type === 'tx') {
      await searchTransaction(query);
    } else if (type === 'address') {
      await searchAddress(query);
    } else if (type === 'block') {
      await searchBlock(query);
    }
  } catch (error) {
    showErrorState(error.message);
  }
}

// Input Validation
function validateInput(type, query) {
  if (!query) {
    throw new Error('Please enter a search query');
  }

  if (type === 'tx' && !/^[a-fA-F0-9]{64}$/.test(query)) {
    throw new Error('Invalid transaction hash');
  }

  if (type === 'address' && !/^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/.test(query)) {
    throw new Error('Invalid Bitcoin address');
  }

  if (type === 'block' && !/^[0-9]+$/.test(query) && !/^[a-fA-F0-9]{64}$/.test(query)) {
    throw new Error('Invalid block height or hash');
  }
}

// UI State Management
function showLoadingState() {
  defaultState.classList.add('hidden');
  loadingState.classList.remove('hidden');
  resultsContent.classList.add('hidden');
}

function showResults(content) {
  defaultState.classList.add('hidden');
  loadingState.classList.add('hidden');
  resultsContent.classList.remove('hidden');
  resultsContent.innerHTML = content;
}

function showErrorState(message) {
  loadingState.classList.add('hidden');
  resultsContent.classList.remove('hidden');
  resultsContent.innerHTML = `
    <div class="error-message">
      <strong>ERROR:</strong> ${message}
    </div>
  `;
}

// Search Functions
async function searchTransaction(txid) {
  const cacheKey = `tx_${txid}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    renderTransaction(cachedData);
    return;
  }
  
  try {
    const [tx, txStatus] = await Promise.all([
      fetchWithFallback(`/tx/${txid}`),
      fetchWithFallback(`/tx/${txid}/status`)
    ]);
    
    tx.status = txStatus;
    cache.set(cacheKey, tx);
    renderTransaction(tx);
  } catch (error) {
    throw new Error('Failed to fetch transaction data');
  }
}

function renderTransaction(tx) {
  let html = `
    <div class="transaction-details">
      <h2>TRANSACTION DETAILS</h2>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-label">TXID:</div>
          <div>${tx.txid}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Status:</div>
          <div>
            ${tx.status.confirmed 
              ? `<span class="badge confirmed">Confirmed</span> (Block #${tx.status.block_height})` 
              : `<span class="badge unconfirmed">Unconfirmed</span>`}
          </div>
        </div>
  `;
  
  if (tx.status.confirmed) {
    html += `
      <div class="data-row">
        <div class="data-label">Confirmations:</div>
        <div>${tx.status.block_height}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Block Time:</div>
        <div>${new Date(tx.status.block_time * 1000).toLocaleString()}</div>
      </div>
    `;
  }
  
  html += `
    <div class="data-row">
      <div class="data-label">Size:</div>
      <div>${tx.size} bytes</div>
    </div>
  `;
  
  // Add more transaction details as needed...
  
  html += `</div></div>`;
  showResults(html);
}

// Additional search functions would be implemented similarly
// async function searchAddress(address) { ... }
// async function searchBlock(blockQuery) { ... }
