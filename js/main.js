document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const searchType = document.getElementById('search-type');

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  function performSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!query) {
      alert('Please enter a search term');
      return;
    }
    
    // Basic validation
    if (type === 'tx' && !/^[a-fA-F0-9]{64}$/.test(query)) {
      alert('Invalid transaction hash');
      return;
    }
    
    if (type === 'address' && !/^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/.test(query)) {
      alert('Invalid Bitcoin address');
      return;
    }
    
    // Redirect to appropriate page with search query
    window.location.href = `/search.html?type=${type}&q=${encodeURIComponent(query)}`;
  }
});
