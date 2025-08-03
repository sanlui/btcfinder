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

// Transaction Search
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
          <div class="monospace">${tx.txid}</div>
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

  // Calculate fee if inputs/outputs are available
  if (tx.vin && tx.vout) {
    const inputSum = tx.vin.reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0);
    const outputSum = tx.vout.reduce((sum, vout) => sum + vout.value, 0);
    const fee = inputSum - outputSum;

    if (fee > 0) {
      html += `
        <div class="data-row">
          <div class="data-label">Fee:</div>
          <div>${formatBTC(fee)}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Fee Rate:</div>
          <div>${(fee / tx.size).toFixed(2)} sat/vB</div>
        </div>
      `;
    }
  }

  // Inputs and Outputs
  html += `
    <div class="tabs">
      <div class="tab active" onclick="switchTab('inputs', 'outputs')">Inputs (${tx.vin.length})</div>
      <div class="tab" onclick="switchTab('outputs', 'inputs')">Outputs (${tx.vout.length})</div>
    </div>
    <div id="inputs" class="tab-content active">
      <ul class="tx-list">
  `;

  tx.vin.forEach((vin, i) => {
    const address = vin.prevout?.scriptpubkey_address || 'Coinbase';
    const value = vin.prevout?.value ? formatBTC(vin.prevout.value) : 'N/A';
    
    html += `
      <li>
        <strong>Input #${i + 1}:</strong>
        ${address === 'Coinbase' ? address : 
          `<a href="#" onclick="event.preventDefault(); performSearch('address', '${address}')" class="tx-link">
            ${address}
          </a>`}
        - ${value}
        ${vin.txid ? `<br><small>From TX: 
          <a href="#" onclick="event.preventDefault(); performSearch('tx', '${vin.txid}')" class="tx-link">
            ${shortenHash(vin.txid)}
          </a></small>` : ''}
      </li>
    `;
  });

  html += `
      </ul>
    </div>
    <div id="outputs" class="tab-content">
      <ul class="tx-list">
  `;

  tx.vout.forEach((vout, i) => {
    const address = vout.scriptpubkey_address || 'Unknown';
    html += `
      <li>
        <strong>Output #${i + 1}:</strong>
        ${address === 'Unknown' ? address : 
          `<a href="#" onclick="event.preventDefault(); performSearch('address', '${address}')" class="tx-link">
            ${address}
          </a>`}
        - ${formatBTC(vout.value)}
      </li>
    `;
  });

  html += `
      </ul>
    </div>
    </div></div>
  `;

  showResults(html);
}

// Address Search
async function searchAddress(address) {
  const cacheKey = `addr_${address}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    renderAddress(cachedData, address);
    return;
  }
  
  try {
    const [addrInfo, txs] = await Promise.all([
      fetchWithFallback(`/address/${address}`),
      fetchWithFallback(`/address/${address}/txs`)
    ]);
    
    const data = { addrInfo, txs };
    cache.set(cacheKey, data);
    renderAddress(data, address);
  } catch (error) {
    throw new Error('Failed to fetch address data');
  }
}

function renderAddress(data, address) {
  const { addrInfo, txs } = data;
  
  const confirmedBalance = (addrInfo.chain_stats.funded_txo_sum - addrInfo.chain_stats.spent_txo_sum) / 1e8;
  const unconfirmedBalance = (addrInfo.mempool_stats.funded_txo_sum - addrInfo.mempool_stats.spent_txo_sum) / 1e8;
  const totalReceived = addrInfo.chain_stats.funded_txo_sum / 1e8;
  const totalSent = addrInfo.chain_stats.spent_txo_sum / 1e8;
  
  let html = `
    <div class="address-details">
      <h2>ADDRESS DETAILS</h2>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-label">Address:</div>
          <div class="monospace">${address}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Confirmed balance:</div>
          <div>${confirmedBalance.toFixed(8)} BTC</div>
        </div>
  `;
  
  if (unconfirmedBalance !== 0) {
    html += `
      <div class="data-row">
        <div class="data-label">Unconfirmed balance:</div>
        <div>${unconfirmedBalance.toFixed(8)} BTC</div>
      </div>
    `;
  }
  
  html += `
    <div class="data-row">
      <div class="data-label">Total received:</div>
      <div>${totalReceived.toFixed(8)} BTC</div>
    </div>
    <div class="data-row">
      <div class="data-label">Total sent:</div>
      <div>${totalSent.toFixed(8)} BTC</div>
    </div>
    <div class="data-row">
      <div class="data-label">Transaction count:</div>
      <div>${addrInfo.chain_stats.tx_count + addrInfo.mempool_stats.tx_count}</div>
    </div>
    <h3>RECENT TRANSACTIONS</h3>
    <ul class="tx-list">
  `;
  
  if (txs.length === 0) {
    html += `<li>No transactions found</li>`;
  } else {
    txs.slice(0, 10).forEach(tx => {
      const isOutgoing = tx.vin.some(vin => vin.prevout?.scriptpubkey_address === address);
      html += `
        <li>
          <span class="badge ${isOutgoing ? 'unconfirmed' : 'confirmed'}">
            ${isOutgoing ? 'Sent' : 'Received'}
          </span>
          <a href="#" onclick="event.preventDefault(); performSearch('tx', '${tx.txid}')" class="tx-link">
            ${shortenHash(tx.txid)}
          </a>
          (${formatBTC(isOutgoing ? 
            tx.vout.reduce((sum, v) => sum + (v.scriptpubkey_address !== address ? v.value : 0), 0) :
            tx.vout.reduce((sum, v) => sum + (v.scriptpubkey_address === address ? v.value : 0), 0))})
          ${tx.status.confirmed ? 
            `<small>${new Date(tx.status.block_time * 1000).toLocaleDateString()}</small>` : 
            '<small>Pending</small>'}
        </li>
      `;
    });
  }
  
  html += `</ul></div></div>`;
  showResults(html);
}

// Block Search
async function searchBlock(blockQuery) {
  const cacheKey = `block_${blockQuery}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    renderBlock(cachedData);
    return;
  }
  
  try {
    let blockHash = blockQuery;
    
    // If it's a number (block height)
    if (/^\d+$/.test(blockQuery)) {
      const hashRes = await fetch(`${API_ENDPOINTS.blockstream}/block-height/${blockQuery}`);
      if (!hashRes.ok) throw new Error('Block not found');
      blockHash = await hashRes.text();
    }
    
    const [block, txs] = await Promise.all([
      fetchWithFallback(`/block/${blockHash}`),
      fetchWithFallback(`/block/${blockHash}/txs`)
    ]);
    
    const data = { block, txs, blockHash };
    cache.set(cacheKey, data);
    renderBlock(data);
  } catch (error) {
    throw new Error('Failed to fetch block data');
  }
}

function renderBlock(data) {
  const { block, txs, blockHash } = data;
  
  let html = `
    <div class="block-details">
      <h2>BLOCK DETAILS</h2>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-label">Height:</div>
          <div>${block.height}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Hash:</div>
          <div class="monospace">${blockHash}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Timestamp:</div>
          <div>${new Date(block.timestamp * 1000).toLocaleString()}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Transactions:</div>
          <div>${block.tx_count}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Size:</div>
          <div>${block.size} bytes</div>
        </div>
        <div class="data-row">
          <div class="data-label">Difficulty:</div>
          <div>${Math.round(block.difficulty).toLocaleString()}</div>
        </div>
        <h3>BLOCK TRANSACTIONS</h3>
        <ul class="tx-list">
  `;
  
  if (txs.length === 0) {
    html += `<li>No transactions available</li>`;
  } else {
    txs.slice(0, 10).forEach(tx => {
      html += `
        <li>
          <a href="#" onclick="event.preventDefault(); performSearch('tx', '${tx.txid}')" class="tx-link">
            ${shortenHash(tx.txid)}
          </a>
          (${formatBTC(tx.vout.reduce((sum, v) => sum + v.value, 0))})
        </li>
      `;
    });
  }
  
  html += `</ul></div></div>`;
  showResults(html);
}

// Helper Functions
window.performSearch = function(type, query) {
  searchType.value = type;
  searchInput.value = query;
  performSearch();
};

window.switchTab = function(showId, hideId) {
  document.getElementById(showId).classList.add('active');
  document.getElementById(hideId).classList.remove('active');
  
  document.querySelector(`.tab[onclick="switchTab('${showId}', '${hideId}')"]`).classList.add('active');
  document.querySelector(`.tab[onclick="switchTab('${hideId}', '${showId}')"]`).classList.remove('active');
};
