async loadContent(path) {
  const page = this.routes[path] || 'home';
  const mainContent = document.getElementById('main-content');
  
  try {
    // Aggiungi un timestamp per evitare cache
    const response = await fetch(`pages/${page}.html?t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Verifica che il contenuto non sia vuoto
    if (!html.trim()) {
      throw new Error('Empty page content');
    }
    
    mainContent.innerHTML = html;
    this.updateActiveLink(page);
    
  } catch (error) {
    console.error('Loading error:', error);
    mainContent.innerHTML = `
      <section class="error-section" style="padding: 2rem; text-align: center;">
        <h2 style="color: var(--error);">Page Loading Error</h2>
        <p>Could not load ${page} page. Technical details:</p>
        <pre style="color: #666; font-size: 0.9rem;">${error.message}</pre>
        <a href="/" style="color: var(--btc-orange);">Return to Home</a>
      </section>
    `;
  }
}
