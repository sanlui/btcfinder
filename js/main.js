document.addEventListener('DOMContentLoaded', function() {
  const searchBtn = document.getElementById('search-button');
  const searchInput = document.getElementById('search-query');
  const searchType = document.getElementById('search-type');
  const resultsDiv = document.getElementById('results');

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') performSearch();
  });

  async function performSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!query) {
      showError('Inserisci un termine di ricerca');
      return;
    }

    showLoading();

    try {
      // Simulazione risposta
      setTimeout(() => {
        if (type === 'address') {
          showAddressResult(query);
        } else if (type === 'tx') {
          showTransactionResult(query);
        } else if (type === 'block') {
          showBlockResult(query);
        }
      }, 800);
    } catch (error) {
      showError('Errore durante la ricerca');
    }
  }

  function showAddressResult(address) {
    resultsDiv.innerHTML = `
      <div class="result-card">
        <h3>INDIRIZZO BITCOIN</h3>
        <p class="monospace">${address}</p>
        <div class="balance">Saldo: 1.25 BTC</div>
        <div class="transactions">
          <h4>ULTIME TRANSAZIONI</h4>
          <ul>
            <li>a1b2c3... - 0.5 BTC</li>
            <li>d4e5f6... - 0.75 BTC</li>
          </ul>
        </div>
      </div>
    `;
  }

  function showLoading() {
    resultsDiv.innerHTML = '<div class="loading">Ricerca in corso...</div>';
  }

  function showError(message) {
    resultsDiv.innerHTML = `<div class="error">${message}</div>`;
  }
});
