
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
    <div class="p-8 text-center text-red-600">
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
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">TRANSACTION DETAILS</h2>
      <div class="space-y-3">
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
  
  // Continue building the transaction HTML...
  
  showResults(html);
}

// Additional search functions (searchAddress, searchBlock) would follow similar patterns
