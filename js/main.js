document.addEventListener('DOMContentLoaded', function() {
  // Elementi DOM
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const resultsContainer = document.getElementById('search-results-container');
  const searchSection = document.querySelector('.search-section');
  const featuresSection = document.querySelector('.features');

  // Gestione della ricerca
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    const type = searchType.value;

    if (!query) {
      showError('Please enter a valid search term');
      return;
    }

    performSearch(type, query);
  });

  // Funzione principale di ricerca
  async function performSearch(type, query) {
    showLoading();
    
    try {
      // Simulazione ritardo API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Nascondi sezioni home
      searchSection.classList.add('hidden');
      featuresSection.classList.add('hidden');
      resultsContainer.classList.remove('hidden');
      
      // Mostra risultati mock (sostituire con API reale)
      if (type === 'address') {
        showAddressResults(query);
      } else if (type === 'tx') {
        showTransactionResults(query);
      } else if (type === 'block') {
        showBlockResults(query);
      }
    } catch (error) {
      console.error('Search error:', error);
      showError('Failed to perform search');
    }
  }

  // Visualizza risultati indirizzo
  function showAddressResults(address) {
    resultsContainer.innerHTML = `
      <div class="address-details fade-in">
        <h2>Address Details</h2>
        
        <div class="address-info">
          <div class="address-info-row">
            <div class="address-label">Address:</div>
            <div class="address-value monospace">${address}</div>
          </div>
          <div class="address-info-row">
            <div class="address-label">Balance:</div>
            <div class="address-value">1.245 BTC</div>
          </div>
          <div class="address-info-row">
            <div class="address-label">Transactions:</div>
            <div class="address-value">42</div>
          </div>
        </div>
        
        <div class="transactions-section">
          <h3>Recent Transactions</h3>
          <ul class="transaction-list">
            ${Array(5).fill().map((_, i) => `
              <li class="transaction-item">
                <div class="transaction-direction ${i % 2 ? 'in' : 'out'}">
                  ${i % 2 ? '↓' : '↑'}
                </div>
                <div>
                  <a href="#" class="transaction-hash">${'a1b2c3d4e5f6'.split('').sort(() => 0.5 - Math.random()).join('')}...</a>
                  <div class="transaction-date">${i+1} hour${i > 0 ? 's' : ''} ago</div>
                </div>
                <div class="transaction-amount">${(Math.random() * 0.5).toFixed(3)} BTC</div>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  // Funzioni di supporto
  function showLoading() {
    resultsContainer.innerHTML = `
      <div class="loading-state fade-in">
        <div class="loader"></div>
        <p>Searching blockchain...</p>
      </div>
    `;
    resultsContainer.classList.remove('hidden');
  }

  function showError(message) {
    resultsContainer.innerHTML = `
      <div class="error-message fade-in">
        <p>${message}</p>
      </div>
    `;
  }

  // Reset alla home (es. da altri link)
  function resetToHome() {
    searchSection.classList.remove('hidden');
    featuresSection.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    searchInput.value = '';
  }

  // Esempio altre funzioni (da implementare)
  function showTransactionResults(txId) {
    resultsContainer.innerHTML = `
      <div class="tx-details fade-in">
        <h2>Transaction Details</h2>
        <div class="data-grid">
          <div class="data-row">
            <div class="data-label">TX ID:</div>
            <div class="data-value monospace">${txId}</div>
          </div>
          <!-- Altri dettagli transazione -->
        </div>
      </div>
    `;
  }

  function showBlockResults(blockId) {
    resultsContainer.innerHTML = `
      <div class="block-details fade-in">
        <h2>Block Details</h2>
        <div class="data-grid">
          <div class="data-row">
            <div class="data-label">Block:</div>
            <div class="data-value">${blockId}</div>
          </div>
          <!-- Altri dettagli blocco -->
        </div>
      </div>
    `;
  }
});
