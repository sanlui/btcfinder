document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');
  const resultsContainer = document.getElementById('search-results-container');
  const searchSection = document.querySelector('.search-section');
  const featuresSection = document.querySelector('.features');

  // Aggiungi questo per debug
  console.log("Tutti gli elementi sono stati catturati correttamente");

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Questo è fondamentale!
    console.log("Form submitted");

    const query = searchInput.value.trim();
    const type = searchType.value;

    if (!query) {
      showError('Inserisci un termine di ricerca valido');
      return;
    }

    performSearch(type, query);
  });

  async function performSearch(type, query) {
    console.log(`Searching for ${type}: ${query}`);
    showLoading();
    
    try {
      // Simuliamo un ritardo di rete
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Nascondi le sezioni principali
      searchSection.style.display = 'none';
      featuresSection.style.display = 'none';
      
      // Mostra i risultati
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = `
        <div class="address-details">
          <h2>Risultati per: ${query}</h2>
          <div class="address-info">
            <div class="address-info-row">
              <div class="address-label">Tipo:</div>
              <div class="address-value">${type.toUpperCase()}</div>
            </div>
            <div class="address-info-row">
              <div class="address-label">Hash:</div>
              <div class="address-value monospace">${query}</div>
            </div>
          </div>
          <p>Questi sono risultati simulati. Collegati a un nodo Bitcoin per dati reali.</p>
        </div>
      `;
      
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      showError('Errore durante la ricerca');
    }
  }

  function showLoading() {
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <p>Sto cercando sulla blockchain...</p>
      </div>
    `;
  }

  function showError(message) {
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
      </div>
    `;
  }
});
