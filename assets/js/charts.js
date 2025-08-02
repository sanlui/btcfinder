import { formatNumber } from './utils.js';

export function renderSimpleChart(prices, container) {
  if (!prices || prices.length === 0) {
    container.innerHTML = '<p>No chart data available</p>';
    return;
  }

  // Implementazione del grafico...
}

export async function loadPriceData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();
    
    // Aggiorna UI con i dati
  } catch (error) {
    console.error('Error loading price data:', error);
  }
}