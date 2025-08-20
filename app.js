// --- INITIALIZATION ---

// DOM Element Selectors
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results-container');
const priceElement = document.getElementById('btc-price');
const chartContainer = document.querySelector('.chart-container');

// API Endpoints
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const MEMPOOL_API_URL = 'https://mempool.space/api';


// --- CORE FUNCTIONS ---

/**
 * Fetches and displays the current Bitcoin price in the header.
 */
async function fetchBtcPrice() {
    try {
        const response = await fetch(`${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const price = data.bitcoin.usd;
        const formattedPrice = price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        priceElement.textContent = `BTC: ${formattedPrice}`;
    } catch (error) {
        priceElement.textContent = 'Price Unavailable';
        console.error('Failed to fetch BTC price:', error);
    }
}

/**
 * Fetches historical data and renders a price chart using Chart.js.
 */
async function renderPriceChart() {
    try {
        const response = await fetch(`${COINGECKO_API_URL}/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily`);
        if (!response.ok) throw new Error('Chart data not available');
        const data = await response.json();

        const chartData = data.prices.map(pricePoint => pricePoint[1]);
        const chartLabels = data.prices.map(pricePoint => new Date(pricePoint[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        const ctx = document.getElementById('btcPriceChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'BTC Price (USD)',
                    data: chartData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { callback: value => '$' + value.toLocaleString('en-US') }, grid: { color: '#e9ecef' } },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (error) {
        console.error("Failed to render chart:", error);
        chartContainer.innerHTML = '<h3>BTC Price Chart</h3><p>Could not load chart data at this time.</p>';
    }
}

/**
 * Handles the main search logic for addresses and transactions.
 */
async function performSearch() {
    const query = searchInput.value.trim();
    resultsContainer.classList.remove('fade-in');
    
    if (!query) {
        resultsContainer.innerHTML = '<p>Please enter a value to search.</p>';
        return;
    }

    resultsContainer.innerHTML = '<p>Scanning the ledger...</p>';
    try {
        const addressResponse = await fetch(`${MEMPOOL_API_URL}/address/${query}`);
        if (addressResponse.ok) {
            const data = await addressResponse.json();
            displayAddressInfo(data);
            return;
        }

        const txResponse = await fetch(`${MEMPOOL_API_URL}/tx/${query}`);
        if (txResponse.ok) {
            const data = await txResponse.json();
            displayTransactionInfo(data);
            return;
        }

        throw new Error('Invalid or unknown identifier.');
    } catch (error) {
        resultsContainer.innerHTML = `<p>System Alert: Identifier could not be found. Please check and try again.</p>`;
    }
}


// --- DISPLAY FUNCTIONS ---

/**
 * Renders the information for a Bitcoin address.
 * @param {object} data - The address data from the API.
 */
function displayAddressInfo(data) {
    const btcBalance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;
    const totalReceived = data.chain_stats.funded_txo_sum / 100000000;
    resultsContainer.innerHTML = `
        <h3>Address Analysis Complete</h3>
        <p><strong>Identifier:</strong><span>${data.address}</span><button class="copy-btn" data-copy-text="${data.address}" aria-label="Copy address">Copy</button></p>
        <p><strong>Current Balance:</strong><span>${btcBalance.toFixed(8)} BTC</span></p>
        <p><strong>Total Received:</strong><span>${totalReceived.toFixed(8)} BTC</span></p>
        <p><strong>Transaction Count:</strong><span>${data.chain_stats.tx_count}</span></p>
    `;
    resultsContainer.classList.add('fade-in');
}

/**
 * Renders the information for a Bitcoin transaction.
 * @param {object} data - The transaction data from the API.
 */
function displayTransactionInfo(data) {
    const totalOutputValue = data.vout.reduce((sum, output) => sum + output.value, 0) / 100000000;
    resultsContainer.innerHTML = `
        <h3>Transaction Details Located</h3>
        <p><strong>Identifier (TxID):</strong><span>${data.txid}</span><button class="copy-btn" data-copy-text="${data.txid}" aria-label="Copy transaction ID">Copy</button></p>
        <p><strong>Status:</strong><span>${data.status.confirmed ? 'Confirmed' : 'Unconfirmed'}</span></p>
        <p><strong>Network Fee:</strong><span>${data.fee} sats</span></p>
        <p><strong>Total Value Transferred:</strong><span>${totalOutputValue.toFixed(8)} BTC</span></p>
    `;
    resultsContainer.classList.add('fade-in');
}


// --- EVENT LISTENERS ---

// Listener for the search button and Enter key
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') performSearch();
});

// Listener for dynamically created "Copy" buttons
resultsContainer.addEventListener('click', event => {
    const copyButton = event.target.closest('.copy-btn');
    if (copyButton) {
        const textToCopy = copyButton.getAttribute('data-copy-text');
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyButton.textContent = 'Copied!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = 'Copy';
                copyButton.classList.remove('copied');
            }, 2000);
        });
    }
});


// --- INITIAL PAGE LOAD ---

// Fetch initial data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchBtcPrice();
    setInterval(fetchBtcPrice, 60000); // Update price every 60 seconds
    renderPriceChart();
});
