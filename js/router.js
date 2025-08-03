async loadContent(path) {
  const page = this.routes[path] || 'home';
  const mainContent = document.getElementById('main-content');
  
  try {
    const cacheBuster = window.location.hostname === 'localhost' ? `?t=${Date.now()}` : '';
    const response = await fetch(`/${page === 'home' ? 'home' : page}.html${cacheBuster}`);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    if (!html.trim()) throw new Error('Empty page content');
    
    mainContent.innerHTML = html;
    this.updateActiveLink(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadPageScript(page);
    
  } catch (error) {
    console.error('Error loading page:', error);
    this.showError(mainContent, page, error);
  }
}
