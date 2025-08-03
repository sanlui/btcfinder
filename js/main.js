import { 
  fetchAddressData, 
  fetchTransactionData, 
  fetchBlockData, 
  currentBlockHeight,
  updateCurrentBlockHeight
} from './api.js';

// Aggiungi le funzioni mancanti:
function showLoadingState(container) {
  container.innerHTML = '<div class="status-message"><div class="loader"></div><p>Searching blockchain...</p></div>';
  container.classList.remove('hidden');
}

function showErrorState(container, error) {
  container.innerHTML = `<div class="error-message">Error: ${error.message || 'Unknown error'}</div>`;
}

// ... (resto del codice)
let currentBlockHeight = 0;

// Funzione principale per la ricerca
async function searchBlockchain(type, query) {
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = '<div class="status-message"><div class="loader"></div><p>Searching blockchain...</p></div>';
  resultsContainer.classList.remove('hidden');

  try {
    // Prima aggiorna l'altezza del blocco corrente
    await updateCurrentBlockHeight();
    
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
    console.error('Error fetching data:', error);
    resultsContainer.innerHTML = `
      <div class="error-message">
        Error: ${error.message || 'Failed to fetch data'}
      </div>
    `;
  }
}

// Aggiorna l'altezza del blocco corrente
async function updateCurrentBlockHeight() {
  try {
    const response = await fetch('https://blockchain.info/q/getblockcount');
    if (!response.ok) throw new Error('Failed to get current block height');
    currentBlockHeight = await response.json();
  } catch (error) {
    console.error('Error updating block height:', error);
    // Usa un valore di fallback se non riesci ad ottenere l'altezza attuale
    currentBlockHeight = 814000;
  }
}

// Funzione per ottenere i dati di un indirizzo
async function fetchAddressData(address) {
  const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=50`);
  
  if (!response.ok) {
    throw new Error('Address not found or API error');
  }
  
  const data = await response.json();
  
  return {
    address: data.address,
    final_balance: (data.final_balance / 100000000).toFixed(8),
    n_tx: data.n_tx,
    total_received: (data.total_received / 100000000).toFixed(8),
    total_sent: (data.total_sent / 100000000).toFixed(8),
    txs: data.txs.map(tx => ({
      hash: tx.hash,
      block_height: tx.block_height,
      inputs: tx.inputs.map(input => ({
        prev_out: {
          addr: input.prev_out?.addr || 'Coinbase',
          value: (input.prev_out?.value / 100000000).toFixed(8) || '0'
        }
      })),
      out: tx.out.map(output => ({
        addr: output.addr,
        value: (output.value / 100000000).toFixed(8)
      }))
    }))
  };
}

// Funzione per ottenere i dati di una transazione
async function fetchTransactionData(txHash) {
  const response = await fetch(`https://blockchain.info/rawtx/${txHash}`);
  if (!response.ok) {
    throw new Error('Transaction not found');
  }
  return await response.json();
}

// Funzione per ottenere i dati di un blocco
async function fetchBlockData(blockHash) {
  const response = await fetch(`https://blockchain.info/rawblock/${blockHash}`);
  if (!response.ok) {
    throw new Error('Block not found');
  }
  return await response.json();
}

// Visualizza i dati dell'indirizzo
function displayAddressData(data) {
  const addressResults = document.getElementById('address-results-template').cloneNode(true);
  addressResults.id = '';
  
  // Popola i dati principali
  addressResults.querySelector('#address-hash').textContent = data.address;
  addressResults.querySelector('#address-balance').textContent = `${data.final_balance} BTC`;
  addressResults.querySelector('#total-transactions').textContent = data.n_tx;
  addressResults.querySelector('#total-received').textContent = `${data.total_received} BTC`;
  addressResults.querySelector('#total-sent').textContent = `${data.total_sent} BTC`;
  addressResults.querySelector('#final-balance').textContent = `${data.final_balance} BTC`;
  addressResults.querySelector('#transactions-count').textContent = `${data.txs.length} transazioni`;

  // Popola le transazioni
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
      <div class="tx-confirmations">${tx.block_height ? (currentBlockHeight - tx.block_height + 1) + ' conferme' : 'Non confermato'}</div>
    `;
    
    transactionsList.appendChild(txItem);
  });

  // Sostituisci il contenuto del container dei risultati
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = '';
  resultsContainer.appendChild(addressResults);
  resultsContainer.classList.remove('hidden');
}

// Visualizza i dati della transazione (base)
function displayTransactionData(data) {
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = `
    <div class="address-data-container">
      <div class="address-header">
        <h2>Transaction Details</h2>
        <div class="address-hash-display">${data.hash}</div>
      </div>
      
      <div class="address-stats-grid">
        <div class="address-stat-card">
          <div class="stat-title">Block Height</div>
          <div class="stat-value">${data.block_height || 'Unconfirmed'}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Size</div>
          <div class="stat-value">${data.size} bytes</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Fee</div>
          <div class="stat-value">${(data.fee / 100000000).toFixed(8)} BTC</div>
        </div>
      </div>
      
      <div class="transactions-section">
        <h3>Transaction I/O</h3>
        <div class="tx-details-grid">
          <div class="tx-io-box">
            <h4>Inputs (${data.inputs.length})</h4>
            ${data.inputs.map(input => `
              <div class="tx-address">${input.prev_out?.addr || 'Coinbase'}</div>
              <div class="tx-amount out">${input.prev_out ? (input.prev_out.value / 100000000).toFixed(8) + ' BTC' : 'Coinbase'}</div>
            `).join('')}
          </div>
          <div class="tx-io-box">
            <h4>Outputs (${data.out.length})</h4>
            ${data.out.map(output => `
              <div class="tx-address">${output.addr}</div>
              <div class="tx-amount">${(output.value / 100000000).toFixed(8)} BTC</div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Visualizza i dati del blocco (base)
function displayBlockData(data) {
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = `
    <div class="address-data-container">
      <div class="address-header">
        <h2>Block Details</h2>
        <div class="address-hash-display">${data.hash}</div>
      </div>
      
      <div class="address-stats-grid">
        <div class="address-stat-card">
          <div class="stat-title">Height</div>
          <div class="stat-value">${data.height}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Timestamp</div>
          <div class="stat-value">${new Date(data.time * 1000).toLocaleString()}</div>
        </div>
        <div class="address-stat-card">
          <div class="stat-title">Transactions</div>
          <div class="stat-value">${data.n_tx}</div>
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
              <a href="#${tx.hash}" class="tx-hash-link">${tx.hash}</a>
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
  // Imposta l'event listener per il form di ricerca
  document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchType = document.getElementById('search-type').value;
    const searchQuery = document.getElementById('search-input').value.trim();
    
    if (searchQuery) {
      await searchBlockchain(searchType, searchQuery);
    }
  });

  // Aggiorna l'altezza del blocco all'avvio
  updateCurrentBlockHeight();
});
