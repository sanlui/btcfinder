import { searchBlockchain } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
  // ... [codice esistente fino a performSearch]

  async function performSearch(type, query) {
    showLoading();
    searchSection.style.display = 'none';
    featuresSection.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    try {
      const data = await searchBlockchain(type, query);
      displayResults(data, type, query);
    } catch (error) {
      showError(error.message || 'Errore durante la ricerca');
    }
  }

  function displayResults(data, type, query) {
    let html = '';
    
    if (type === 'address') {
      html = `
        <div class="address-details">
          <h2>Address: ${query}</h2>
          <div class="address-info">
            <div class="address-info-row">
              <div class="address-label">Balance:</div>
              <div class="address-value">${data.chain_stats.funded_txo_sum / 100000000} BTC</div>
            </div>
          </div>
        </div>
      `;
    } 
    // Aggiungi altri casi per tx e block
    
    resultsContainer.innerHTML = html || `
      <div class="error">
        <p>Tipo di ricerca non supportato: ${type}</p>
      </div>
    `;
  }

  // ... [restante codice esistente]
});
