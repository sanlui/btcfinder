// Cache system
const cache = {
  data: {},
  get(key) {
    return this.data[key] || null;
  },
  set(key, value) {
    this.data[key] = value;
    // Remove from cache after 5 minutes
    setTimeout(() => delete this.data[key], 300000);
  },
  clear() {
    this.data = {};
  }
};

// Utility functions
const utils = {
  formatBTC(satoshi) {
    return (satoshi / 1e8).toFixed(8) + ' BTC';
  },
  
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  
  shortenHash(hash, start = 10, end = 10) {
    if (!hash) return '';
    if (hash.length > start + end) {
      return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
    }
    return hash;
  },
  
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  },
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Input validation
const validator = {
  tx(query) {
    if (!/^[a-fA-F0-9]{64}$/.test(query)) {
      throw new Error('Invalid TXID. Must be 64 hexadecimal characters');
    }
  },
  
  address(query) {
    if (!/^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/.test(query)) {
      throw new Error('Invalid Bitcoin address');
    }
  },
  
  block(query) {
    if (!/^[0-9]+$/.test(query) && !/^[a-fA-F0-9]{64}$/.test(query)) {
      throw new Error('Invalid block. Enter a number (height) or hash (64 hexadecimal characters)');
    }
  }
};

// API service
const api = {
  async getTransaction(txid) {
    const [txRes, txStatusRes] = await Promise.all([
      fetch(`https://blockstream.info/api/tx/${txid}`),
      fetch(`https://blockstream.info/api/tx/${txid}/status`)
    ]);
    
    if (!txRes.ok || !txStatusRes.ok) throw new Error('Transaction not found');
    
    const tx = await txRes.json();
    const txStatus = await txStatusRes.json();
    tx.status = txStatus;
    
    return tx;
  },
  
  async getAddress(address) {
    const [addrRes, txsRes, priceRes] = await Promise.all([
      fetch(`https://blockstream.info/api/address/${address}`),
      fetch(`https://blockstream.info/api/address/${address}/txs`),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
    ]);
    
    if (!addrRes.ok) throw new Error('Address not found');
    
    const addrInfo = await addrRes.json();
    const txs = txsRes.ok ? await txsRes.json() : [];
    const priceData = priceRes.ok ? await priceRes.json() : null;
    
    return { addrInfo, txs, priceData };
  },
  
  async getBlock(blockQuery) {
    let blockHash = blockQuery;
    
    // If it's a number (block height)
    if (/^\d+$/.test(blockQuery)) {
      const hashRes = await fetch(`https://blockstream.info/api/block-height/${blockQuery}`);
      if (!hashRes.ok) throw new Error('Block not found');
      blockHash = await hashRes.text();
    }
    
    const [blockRes, txsRes] = await Promise.all([
      fetch(`https://blockstream.info/api/block/${blockHash}`),
      fetch(`https://blockstream.info/api/block/${blockHash}/txs`)
    ]);
    
    if (!blockRes.ok) throw new Error('Block not found');
    
    const block = await blockRes.json();
    const txs = txsRes.ok ? await txsRes.json() : [];
    
    return { block, txs, blockHash };
  },
  
  async getNetworkStats() {
    const [blockRes, mempoolRes, priceRes, diffRes] = await Promise.all([
      fetch('https://blockstream.info/api/blocks/tip/height'),
      fetch('https://blockstream.info/api/mempool'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
      fetch('https://blockstream.info/api/blocks/tip')
    ]);
    
    const blockHeight = await blockRes.text();
    const mempool = await mempoolRes.json();
    const price = priceRes.ok ? await priceRes.json() : { bitcoin: { usd: 'N/A' } };
    const difficulty = diffRes.ok ? (await diffRes.json()).difficulty : 'N/A';
    
    return { blockHeight, mempool, price, difficulty };
  }
};

// UI rendering functions
const renderer = {
  transaction(tx) {
    let html = `<h2>Transaction Details</h2>`;
    
    // Basic info
    html += this.renderDataRow('TXID:', tx.txid, true);
    html += this.renderDataRow('Status:', tx.status.confirmed ? 
      `<span class="badge confirmed">Confirmed</span> (Block #${tx.status.block_height})` : 
      `<span class="badge unconfirmed">Unconfirmed</span>`);
    
    if (tx.status.confirmed) {
      html += this.renderDataRow('Confirmations:', utils.formatNumber(tx.status.block_height));
    }
    
    html += this.renderDataRow('Date/Time:', tx.status.confirmed ? 
      new Date(tx.status.block_time * 1000).toLocaleString() : 
      'In mempool (unconfirmed)');
    
    html += this.renderDataRow('Size:', `${utils.formatNumber(tx.size)} bytes`);
    
    // Calculate fee if available
    if (tx.vin && tx.vout) {
      const inputSum = tx.vin.reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0);
      const outputSum = tx.vout.reduce((sum, vout) => sum + vout.value, 0);
      const fee = inputSum - outputSum;
      
      if (fee > 0) {
        html += this.renderDataRow('Fee:', `${utils.formatBTC(fee)} (${utils.formatNumber(fee)} satoshis)`);
        html += this.renderDataRow('Fee rate:', `${(fee / tx.size).toFixed(2)} satoshis/byte`);
      }
    }
    
    // Add to favorites button
    html += `<button class="button secondary" onclick="saveFavorite('tx', '${tx.txid}', 'TX ${utils.shortenHash(tx.txid)}')">
      ★ Save to Favorites
    </button>`;
    
    // Inputs and Outputs tabs
    html += `<div class="tabs">
      <div class="tab active" onclick="switchTab('inputs', 'outputs')">Inputs (${tx.vin.length})</div>
      <div class="tab" onclick="switchTab('outputs', 'inputs')">Outputs (${tx.vout.length})</div>
    </div>`;
    
    // Inputs Tab
    html += `<div id="inputs" class="tab-content active"><ul class="list">`;
    tx.vin.forEach((vin, i) => {
      const address = vin.prevout?.scriptpubkey_address || 'Coinbase (new coin generation)';
      const value = vin.prevout?.value ? utils.formatBTC(vin.prevout.value) : 'N/A';
      
      html += `<li class="list-item">
        <strong>Input #${i + 1}:</strong> 
        ${address.startsWith('Coinbase') ? address : 
          `<a href="#" class="tx-link" onclick="performSearchAddress('${address}')">${address}</a>`}
        - ${value}
        ${vin.txid ? `<br><small>From TX: <a href="#" class="tx-link" onclick="performSearchTx('${vin.txid}')">${utils.shortenHash(vin.txid)}</a></small>` : ''}
      </li>`;
    });
    html += `</ul></div>`;
    
    // Outputs Tab
    html += `<div id="outputs" class="tab-content"><ul class="list">`;
    tx.vout.forEach((vout, i) => {
      const address = vout.scriptpubkey_address || 'N/A (non-standard script)';
      html += `<li class="list-item">
        <strong>Output #${i + 1}:</strong> 
        ${address === 'N/A (non-standard script)' ? address : 
          `<a href="#" class="tx-link" onclick="performSearchAddress('${address}')">${address}</a>`}
        - ${utils.formatBTC(vout.value)}
      </li>`;
    });
    html += `</ul></div>`;
    
    return html;
  },
  
  address(data, address) {
    const { addrInfo, txs, priceData } = data;
    
    const confirmedBalance = (addrInfo.chain_stats.funded_txo_sum - addrInfo.chain_stats.spent_txo_sum) / 1e8;
    const unconfirmedBalance = (addrInfo.mempool_stats.funded_txo_sum - addrInfo.mempool_stats.spent_txo_sum) / 1e8;
    const totalReceived = addrInfo.chain_stats.funded_txo_sum / 1e8;
    const totalSent = addrInfo.chain_stats.spent_txo_sum / 1e8;
    
    const usdValue = priceData ? (confirmedBalance * priceData.bitcoin.usd).toLocaleString() : null;
    
    let html = `<h2>Address Details</h2>`;
    
    // QR Code and Address
    html += `<div style="display:flex; gap:20px; flex-wrap:wrap;">
      <div class="qr-code">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:${address}" 
             alt="QR Code for ${address}" width="200" height="200">
      </div>
      <div style="flex:1; min-width:200px;">
        ${this.renderDataRow('Address:', address, true)}
        
        <div class="balance-highlight">
          <span class="btc-symbol">₿</span> ${confirmedBalance.toFixed(8)} BTC
          ${usdValue ? `<small>($${usdValue} USD)</small>` : ''}
        </div>
    `;
    
    if (unconfirmedBalance !== 0) {
      html += this.renderDataRow('Unconfirmed:', `<span class="btc-symbol">₿</span> ${unconfirmedBalance.toFixed(8)} BTC`);
    }
    
    // Add to favorites button
    html += `<button class="button secondary" onclick="saveFavorite('address', '${address}', 'Address ${utils.shortenHash(address)}')" style="margin-top:10px;">
      ★ Save to Favorites
    </button>`;
    
    // Close QR code section
    html += `</div></div>`;
    
    // Stats section
    html += `<div class="advanced-options">
      <h3>Address Statistics</h3>
      ${this.renderDataRow('Total Received:', `<span class="btc-symbol">₿</span> ${totalReceived.toFixed(8)} BTC`)}
      ${this.renderDataRow('Total Sent:', `<span class="btc-symbol">₿</span> ${totalSent.toFixed(8)} BTC`)}
      ${this.renderDataRow('Transaction Count:', utils.formatNumber(addrInfo.chain_stats.tx_count + addrInfo.mempool_stats.tx_count))}
    </div>`;
    
    // Show recent transactions
    html += `<h3>Recent Transactions</h3>`;
    
    if (txs.length === 0) {
      html += `<p>No transactions found</p>`;
    } else {
      html += `<ul class="list">`;
      txs.slice(0, 10).forEach(tx => {
        const isOutgoing = tx.vin.some(vin => vin.prevout?.scriptpubkey_address === address);
        const amount = isOutgoing ? 
          tx.vout.reduce((sum, v) => sum + (v.scriptpubkey_address !== address ? v.value : 0), 0) :
          tx.vout.reduce((sum, v) => sum + (v.scriptpubkey_address === address ? v.value : 0), 0);
        
        html += `<li class="list-item">
          <span class="badge ${isOutgoing ? 'unconfirmed' : 'confirmed'}">${isOutgoing ? 'Sent' : 'Received'}</span>
          <a href="#" class="tx-link" onclick="performSearchTx('${tx.txid}')">${utils.shortenHash(tx.txid)}</a>
          (<span class="btc-symbol">₿</span> ${utils.formatBTC(amount)})
          ${tx.status.confirmed ? 
            `<small>${new Date(tx.status.block_time * 1000).toLocaleDateString()}</small>` : 
            '<small>In mempool</small>'}
        </li>`;
      });
      html += `</ul>`;
    }
    
    return html;
  },
  
  block(data) {
    const { block, txs, blockHash } = data;
    
    let html = `<h2>Block Details</h2>`;
    
    // Basic block info
    html += this.renderDataRow('Height:', utils.formatNumber(block.height));
    html += this.renderDataRow('Hash:', blockHash, true);
    html += this.renderDataRow('Date/Time:', new Date(block.timestamp * 1000).toLocaleString());
    html += this.renderDataRow('Transaction Count:', utils.formatNumber(block.tx_count));
    html += this.renderDataRow('Size:', `${utils.formatNumber(block.size)} bytes`);
    html += this.renderDataRow('Difficulty:', utils.formatNumber(Math.round(block.difficulty)));
    html += this.renderDataRow('Version:', `0x${block.version.toString(16)}`);
    html += this.renderDataRow('Merkle Root:', block.merkle_root);
    
    // Add to favorites button
    html += `<button class="button secondary" onclick="saveFavorite('block', '${blockHash}', 'Block ${block.height}')">
      ★ Save to Favorites
    </button>`;
    
    // Recent transactions in block
    html += `<h3>Recent Transactions</h3>`;
    
    if (txs.length === 0) {
      html += `<p>No transactions available</p>`;
    } else {
      html += `<ul class="list">`;
      txs.slice(0, 10).forEach(tx => {
        html += `<li class="list-item">
          <a href="#" class="tx-link" onclick="performSearchTx('${tx.txid}')">${utils.shortenHash(tx.txid)}</a>
          (<span class="btc-symbol">₿</span> ${utils.formatBTC(tx.vout.reduce((sum, v) => sum + v.value, 0))})
        </li>`;
      });
      html += `</ul>`;
    }
    
    return html;
  },
  
  dashboard(stats) {
    const { blockHeight, mempool, price, difficulty } = stats;
    
    return `
      <h2>Bitcoin Network Dashboard</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Current Block Height</h3>
          <div class="stat-value">${utils.formatNumber(blockHeight)}</div>
        </div>
        
        <div class="stat-card">
          <h3>Mempool Size</h3>
          <div class="stat-value">${utils.formatNumber(mempool.count)} tx</div>
        </div>
        
        <div class="stat-card">
          <h3>Bitcoin Price</h3>
          <div class="stat-value">$${price.bitcoin.usd.toLocaleString()}</div>
        </div>
        
        <div class="stat-card">
          <h3>Network Difficulty</h3>
          <div class="stat-value">${utils.formatNumber(Math.round(difficulty))}</div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas id="networkChart"></canvas>
      </div>
    `;
  },
  
  favorites(favorites) {
    if (favorites.length === 0) return '';
    
    let html = `<div class="favorites-section">
      <h3>Saved Favorites</h3>
      <ul class="list">`;
    
    favorites.forEach(fav => {
      html += `<li class="list-item">
        <a href="#" onclick="loadFavorite('${fav.type}', '${fav.id}')">${fav.label}</a>
        <small>(${fav.type}, ${new Date(fav.date).toLocaleDateString()})</small>
      </li>`;
    });
    
    html += `</ul></div>`;
    return html;
  },
  
  renderDataRow(label, value, copyable = false) {
    let copyBtn = '';
    if (copyable) {
      copyBtn = `<button class="copy-btn" onclick="utils.copyToClipboard('${value.replace(/'/g, "\\'")}')">Copy</button>`;
    }
    
    return `<div class="data-row">
      <div class="data-label">${label}</div>
      <div class="data-value">${value} ${copyBtn}</div>
    </div>`;
  },
  
  renderNetworkChart() {
    const ctx = document.getElementById('networkChart')?.getContext('2d');
    if (!ctx) return;
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Bitcoin Price (USD)',
          data: [30000, 35000, 40000, 45000, 50000, 55000],
          borderColor: 'rgba(247, 147, 26, 1)',
          backgroundColor: 'rgba(247, 147, 26, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Bitcoin Price History'
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
};

// Favorites system
const favorites = {
  get() {
    return JSON.parse(localStorage.getItem('bitcoinFavorites') || '[]');
  },
  
  save(type, id, label) {
    const favorites = this.get();
    if (!favorites.some(fav => fav.id === id)) {
      favorites.push({ type, id, label, date: new Date().toISOString() });
      localStorage.setItem('bitcoinFavorites', JSON.stringify(favorites));
      utils.showToast('Added to favorites!', 'success');
      return true;
    } else {
      utils.showToast('This item is already in your favorites', 'warning');
      return false;
    }
  },
  
  remove(id) {
    const updatedFavorites = this.get().filter(fav => fav.id !== id);
    localStorage.setItem('bitcoinFavorites', JSON.stringify(updatedFavorites));
    utils.showToast('Removed from favorites', 'success');
    return updatedFavorites;
  }
};

// Main application functions
async function performSearch() {
  const type = document.getElementById('searchType').value;
  const query = document.getElementById('searchInput').value.trim();
  const resultDiv = document.getElementById('result');
  const originalContent = resultDiv.innerHTML;
  
  try {
    // Validate input
    if (!query) throw new Error('Please enter a valid value');
    validator[type](query);
    
    // Show loading state
    resultDiv.innerHTML = '<div class="loader"></div><p style="text-align:center;">Loading data...</p>';
    
        // Check cache first
    const cacheKey = `${type}:${query}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      renderResult(type, cachedData, query);
      return;
    }
    
    // Fetch data from API
    let data;
    switch (type) {
      case 'tx':
        data = await api.getTransaction(query);
        break;
      case 'address':
        data = await api.getAddress(query);
        break;
      case 'block':
        data = await api.getBlock(query);
        break;
      default:
        throw new Error('Invalid search type');
    }
    
    // Cache the result
    cache.set(cacheKey, data);
    
    // Render the result
    renderResult(type, data, query);
    
  } catch (err) {
    resultDiv.innerHTML = originalContent;
    utils.showToast(err.message, 'error');
    console.error(err);
  }
}

function renderResult(type, data, query) {
  const resultDiv = document.getElementById('result');
  
  switch (type) {
    case 'tx':
      resultDiv.innerHTML = renderer.transaction(data);
      break;
    case 'address':
      resultDiv.innerHTML = renderer.address(data, query);
      break;
    case 'block':
      resultDiv.innerHTML = renderer.block(data);
      break;
    default:
      resultDiv.innerHTML = '<p>Invalid result type</p>';
  }
  
  // Show favorites section
  const favs = favorites.get();
  if (favs.length > 0) {
    resultDiv.insertAdjacentHTML('beforeend', renderer.favorites(favs));
  }
}

// Helper functions for UI interactions
function performSearchTx(txid) {
  document.getElementById('searchType').value = 'tx';
  document.getElementById('searchInput').value = txid;
  performSearch();
}

function performSearchAddress(address) {
  document.getElementById('searchType').value = 'address';
  document.getElementById('searchInput').value = address;
  performSearch();
}

function switchTab(showId, hideId) {
  document.getElementById(showId).classList.add('active');
  document.getElementById(hideId).classList.remove('active');
  
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.textContent.includes(showId.charAt(0).toUpperCase() + showId.slice(1))) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

function saveFavorite(type, id, label) {
  if (favorites.save(type, id, label)) {
    // Update favorites display
    const favs = favorites.get();
    const favSection = document.querySelector('.favorites-section');
    if (favSection) {
      favSection.innerHTML = renderer.favorites(favs);
    } else {
      document.getElementById('result').insertAdjacentHTML('beforeend', renderer.favorites(favs));
    }
  }
}

function loadFavorite(type, id) {
  document.getElementById('searchType').value = type;
  document.getElementById('searchInput').value = id;
  performSearch();
}

// Initialize the app
async function initApp() {
  // Load dashboard by default
  try {
    const stats = await api.getNetworkStats();
    document.getElementById('result').innerHTML = renderer.dashboard(stats);
    renderer.renderNetworkChart();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
  
  // Set up event listeners
  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
  });
  
  document.getElementById('clearCache').addEventListener('click', () => {
    cache.clear();
    utils.showToast('Cache cleared', 'success');
  });
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
