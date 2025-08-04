import { 
  fetchAddressData, 
  fetchTransactionData, 
  fetchBlockData, 
  updateCurrentBlockHeight,
  currentBlockHeight
} from './api.js';

// Cache per memorizzare le ricerche recenti
const searchCache = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minuti

// Stato dell'applicazione
const appState = {
  currentPage: 1,
  itemsPerPage: 10,
  currentSearch: null
};

/**
 * Mostra lo stato di caricamento
 * @param {HTMLElement} container - Contenitore dei risultati
 */
function showLoadingState(container) {
  container.innerHTML = `
    <div class="status-message" aria-live="polite" aria-busy="true">
      <div class="loader" aria-hidden="true"></div>
      <p>Searching blockchain...</p>
    </div>
  `;
  container.classList.remove('hidden');
}

/**
 * Mostra lo stato di errore
 * @param {HTMLElement} container - Contenitore dei risultati
 * @param {Error} error - Oggetto errore
 */
function showErrorState(container, error) {
  let errorMessage = 'An error occurred';
  
  if (error.message.includes('Failed to fetch')) {
    errorMessage = 'Network error. Please check your internet connection.';
  } else if (error.message.includes('404')) {
    errorMessage = 'Data not found. Please verify your search query.';
  } else if (error.message.includes('400')) {
    errorMessage = 'Invalid request. Please check your input.';
  } else {
    errorMessage = `Error: ${error.message}`;
  }

  container.innerHTML = `
    <div class="error-message" role="alert">
      <svg class="error-icon" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>${errorMessage}</p>
      <button class="retry-btn">Try Again</button>
    </div>
  `;

  // Aggiungi gestore eventi per il pulsante di riprova
  container.querySelector('.retry-btn')?.addEventListener('click', () => {
    if (appState.currentSearch) {
      searchBlockchain(appState.currentSearch.type, appState.currentSearch.query);
    }
  });
}

/**
 * Cerca sulla blockchain
 * @param {string} type - Tipo di ricerca (address, tx, block)
 * @param {string} query - Termine di ricerca
 */
async function searchBlockchain(type, query) {
  const resultsContainer = document.getElementById('search-results-container');
  appState.currentSearch = { type, query };
  
  // Verifica la cache prima di fare la richiesta
  const cacheKey = `${type}:${query}`;
  const cachedData = searchCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION)) {
    displaySearchResults(type, cachedData.data);
    return;
  }

  showLoadingState(resultsContainer);

  try {
    let data;
    switch (type) {
      case 'address':
        data = await fetchAddressData(query);
        break;
      case 'tx':
        data = await fetchTransactionData(query);
        break;
      case 'block':
        data = await fetchBlockData(query);
        break;
      default:
        throw new Error('Invalid search type');
    }

    // Aggiorna la cache
    searchCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    displaySearchResults(type, data);
  } catch (error) {
    console.error('Search error:', error);
    showErrorState(resultsContainer, error);
  }
}

/**
 * Mostra i risultati della ricerca
 * @param {string} type - Tipo di ricerca
 * @param {Object} data - Dati da visualizzare
 */
function displaySearchResults(type, data) {
  const resultsContainer = document.getElementById('search-results-container');
  
  switch (type) {
    case 'address':
      displayAddressData(data);
      break;
    case 'tx':
      displayTransactionData(data);
      break;
    case 'block':
      displayBlockData(data);
      break;
  }

  // Scroll ai risultati
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Formatta un valore in BTC
 * @param {number} value - Valore in satoshi
 * @returns {string} Valore formattato in BTC
 */
function formatBTC(value) {
  return (value / 1e8).toFixed(8).replace(/\.?0+$/, '');
}

/**
 * Formatta un timestamp in data leggibile
 * @param {number} timestamp - Timestamp Unix
 * @returns {string} Data formattata
 */
function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Mostra i dati di un indirizzo
 * @param {Object} data - Dati dell'indirizzo
 */
function displayAddressData(data) {
  const template = document.getElementById('address-results-template');
  const clone = template.content.cloneNode(true);
  const addressResults = clone.firstElementChild;

  // Aggiorna i dati principali
  addressResults.querySelector('#address-hash').textContent = data.address;
  addressResults.querySelector('#address-balance').textContent = `${formatBTC(data.final_balance)} BTC`;
  addressResults.querySelector('#total-transactions').textContent = data.n_tx.toLocaleString();
  addressResults.querySelector('#total-received').textContent = `${formatBTC(data.total_received)} BTC`;
  addressResults.querySelector('#total-sent').textContent = `${formatBTC(data.total_sent)} BTC`;
  addressResults.querySelector('#final-balance').textContent = `${formatBTC(data.final_balance)} BTC`;
  
  // Gestione della paginazione
  const totalPages = Math.ceil(data.txs.length / appState.itemsPerPage);
  updatePaginationControls(totalPages, data.txs.length);

  // Mostra le transazioni per la pagina corrente
  displayTransactionsPage(data.txs, 1);

  // Sostituisci il contenuto del container
  const resultsContainer = document.getElementById('search-results-container');
  resultsContainer.innerHTML = '';
  resultsContainer.appendChild(addressResults);
  resultsContainer.classList.remove('hidden');
}

/**
 * Mostra una pagina di transazioni
 * @param {Array} transactions - Lista di transazioni
 * @param {number} page - Numero di pagina
 */
function displayTransactionsPage(transactions, page) {
  const startIndex = (page - 1) * appState.itemsPerPage;
  const endIndex = startIndex + appState.itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const transactionsList = document.getElementById('transactions-list');
  transactionsList.innerHTML = '';

  paginatedTransactions.forEach(tx => {
    const txItem = document.createElement('li');
    txItem.className = 'transaction-item';
    txItem.innerHTML = `
      <div class="tx-header">
        <a href="#${tx.hash}" class="tx-hash-link" aria-label="Transaction details">
          ${shortenHash(tx.hash)}
        </a>
        <span class="tx-time">${formatDate(tx.time)}</span>
      </div>
      <div class="tx-details-grid">
        <div class="tx-io-box">
          <div class="stat-title">Inputs (${tx.inputs.length})</div>
          ${tx.inputs.slice(0, 3).map(input => `
            <div class="tx-address" title="${input.prev_out?.addr || 'Coinbase'}">
              ${input.prev_out?.addr ? shortenAddress(input.prev_out.addr) : 'Coinbase'}
            </div>
            <div class="tx-amount out">
              -${formatBTC(input.prev_out?.value || 0)} BTC
            </div>
          `).join('')}
          ${tx.inputs.length > 3 ? `<div class="tx-more">+${tx.inputs.length - 3} more</div>` : ''}
        </div>
        <div class="tx-io-box">
          <div class="stat-title">Outputs (${tx.out.length})</div>
          ${tx.out.slice(0, 3).map(output => `
            <div class="tx-address" title="${output.addr}">
              ${output.addr ? shortenAddress(output.addr) : 'OP_RETURN'}
            </div>
            <div class="tx-amount">
              +${formatBTC(output.value)} BTC
            </div>
          `).join('')}
          ${tx.out.length > 3 ? `<div class="tx-more">+${tx.out.length - 3} more</div>` : ''}
        </div>
      </div>
      <div class="tx-footer">
        <span class="tx-fee">Fee: ${formatBTC(tx.fee)} BTC</span>
        <span class="tx-confirmations">
          ${tx.block_height ? `${currentBlockHeight - tx.block_height + 1} confirmations` : 'Unconfirmed'}
        </span>
      </div>
    `;
    transactionsList.appendChild(txItem);
  });

  // Aggiorna l'indicatore della pagina
  document.getElementById('page-info').textContent = `Page ${page} of ${Math.ceil(transactions.length / appState.itemsPerPage)}`;
  appState.currentPage = page;
}

/**
 * Accorcia un indirizzo/hash per la visualizzazione
 * @param {string} str - Indirizzo o hash
 * @returns {string} Versione accorciata
 */
function shortenHash(str) {
  return str.length > 20 ? `${str.substring(0, 10)}...${str.substring(str.length - 10)}` : str;
}

/**
 * Accorcia un indirizzo Bitcoin
 * @param {string} address - Indirizzo Bitcoin
 * @returns {string} Versione accorciata
 */
function shortenAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Aggiorna i controlli di paginazione
 * @param {number} totalPages - Numero totale di pagine
 * @param {number} totalItems - Numero totale di elementi
 */
function updatePaginationControls(totalPages, totalItems) {
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  prevBtn.disabled = appState.currentPage <= 1;
  nextBtn.disabled = appState.currentPage >= totalPages;

  prevBtn.onclick = () => {
    if (appState.currentPage > 1) {
      displayTransactionsPage(appState.currentSearch.data.txs, appState.currentPage - 1);
    }
  };

  nextBtn.onclick = () => {
    if (appState.currentPage < totalPages) {
      displayTransactionsPage(appState.currentSearch.data.txs, appState.currentPage + 1);
    }
  };

  // Mostra/nascondi i controlli se necessario
  const paginationControls = document.querySelector('.transaction-controls');
  paginationControls.style.display = totalItems > appState.itemsPerPage ? 'flex' : 'none';
}

// Inizializzazione dell'app
document.addEventListener('DOMContentLoaded', () => {
  // Imposta l'anno corrente nel footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Gestore per il form di ricerca
  document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchType = document.getElementById('search-type').value;
    const searchQuery = document.getElementById('search-input').value.trim();

    if (searchQuery) {
      await searchBlockchain(searchType, searchQuery);
      // Aggiungi alla cronologia delle ricerche
      addToSearchHistory(searchType, searchQuery);
    }
  });

  // Aggiorna l'altezza del blocco corrente
  updateCurrentBlockHeight().then(height => {
    currentBlockHeight = height;
    console.log(`Current block height: ${height}`);
  }).catch(err => {
    console.error('Failed to fetch block height:', err);
  });

  // Gestori per la modalità giorno/notte
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
});

/**
 * Aggiunge una ricerca alla cronologia
 */
function addToSearchHistory(type, query) {
  // Implementa la logica per salvare le ricerche recenti
  // (es. in localStorage o in uno stato dell'app)
}

/**
 * Cambia il tema tra chiaro/scuro
 */
function toggleTheme() {
  const root = document.documentElement;
  const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}
