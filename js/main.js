document.addEventListener('DOMContentLoaded', () => {
  // Elementi del DOM
  const searchForm = document.getElementById('search-form');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');

  // Gestione eventi
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
    searchBtn.addEventListener('click', handleSearch);
  }

  // Funzione principale di ricerca
  async function handleSearch(e) {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!query) {
      showAlert('Please enter a search term');
      return;
    }
    
    // Validazione input
    if (!validateInput(type, query)) {
      return;
    }
    
    // Mostra stato di caricamento
    showLoading();
    
    try {
      // Esegui la ricerca
      const result = await performSearch(type, query);
      
      // Mostra risultati
      displayResults(result);
    } catch (error) {
      showAlert('Search failed: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  // Funzioni di supporto
  function validateInput(type, query) {
    const validations = {
      tx: /^[a-fA-F0-9]{64}$/,
      address: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
      block: /^[0-9]+$|^[a-fA-F0-9]{64}$/
    };
    
    if (!validations[type].test(query)) {
      showAlert(`Invalid ${type} format`);
      return false;
    }
    return true;
  }

  async function performSearch(type, query) {
    // Qui implementerai la chiamata API reale
    // Esempio con mock:
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          type,
          query,
          data: `${type} data for ${query}`
        });
      }, 1000);
    });
    
    // Per un'implementazione reale, usa:
    // const response = await fetch(`/api/search?type=${type}&q=${query}`);
    // return await response.json();
  }

  function displayResults(result) {
    const resultsHTML = `
      <div class="search-results fade-in">
        <h3>Search Results</h3>
        <div class="result-card">
          <h4>${result.type.toUpperCase()}</h4>
          <p>${result.query}</p>
          <pre>${JSON.stringify(result.data, null, 2)}</pre>
        </div>
      </div>
    `;
    
    document.getElementById('main-content').insertAdjacentHTML('beforeend', resultsHTML);
  }

  function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    searchBtn.disabled = true;
    searchBtn.innerHTML = 'Searching...';
  }

  function hideLoading() {
    searchBtn.disabled = false;
    searchBtn.innerHTML = 'Search';
  }

  function showAlert(message) {
    alert(message); // Sostituisci con un modal più elegante
  }
});
