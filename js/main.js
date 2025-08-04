// Sistema di Cache migliorato con dimensione massima
const cache = {
    data: {},
    maxSize: 100, // Limite massimo di elementi in cache
    get(key) {
        return this.data[key] || null;
    },
    set(key, value) {
        // Pulisci la cache se supera la dimensione massima
        if (Object.keys(this.data).length >= this.maxSize) {
            this.clearOldest(20); // Rimuovi il 20% più vecchio
        }
        
        this.data[key] = {
            value: value,
            timestamp: Date.now()
        };
        
        // Rimuove automaticamente dopo 5 minuti (300000 ms)
        setTimeout(() => {
            if (this.data[key]) {
                delete this.data[key];
            }
        }, 300000);
    },
    clear() {
        this.data = {};
    },
    clearOldest(percentage) {
        const entries = Object.entries(this.data);
        const toRemove = Math.ceil(entries.length * (percentage / 100));
        
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
              .slice(0, toRemove)
              .forEach(([key]) => delete this.data[key]);
    }
};

// Modulo di sicurezza per prevenire XSS
const security = {
    html(input) {
        if (!input) return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },
    url(input) {
        if (!input) return '';
        return encodeURI(input).replace(/javascript:/gi, '');
    }
};

// Utility functions con protezione XSS
const utils = {
    formatBTC(satoshi) {
        if (isNaN(satoshi)) return '0.00000000 BTC';
        return security.html((satoshi / 1e8).toFixed(8)) + ' BTC';
    },
    
    formatNumber(num) {
        if (isNaN(num)) return '0';
        return security.html(num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    },
    
    shortenHash(hash, start = 10, end = 10) {
        if (!hash) return '';
        const sanitized = security.html(hash);
        if (sanitized.length > start + end) {
            return `${sanitized.substring(0, start)}...${sanitized.substring(sanitized.length - end)}`;
        }
        return sanitized;
    },
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    },
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = security.html(message);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Nuova funzione per gestire la paginazione
    paginate(items, currentPage, itemsPerPage) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return {
            currentPage,
            totalPages: Math.ceil(items.length / itemsPerPage),
            items: items.slice(startIndex, startIndex + itemsPerPage)
        };
    }
};

// Validatori migliorati
const validator = {
    tx(query) {
        if (!query || !/^[a-fA-F0-9]{64}$/.test(security.html(query))) {
            throw new Error('TXID non valido. Deve contenere 64 caratteri esadecimali');
        }
    },
    
    address(query) {
        if (!query || !/^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/.test(security.html(query))) {
            throw new Error('Indirizzo Bitcoin non valido');
        }
    },
    
    block(query) {
        if (!query || (!/^[0-9]+$/.test(query) && !/^[a-fA-F0-9]{64}$/.test(query))) {
            throw new Error('Blocco non valido. Inserisci un numero (altezza) o un hash (64 caratteri esadecimali)');
        }
    }
};

// API service con gestione errori migliorata
const api = {
    async fetchWithTimeout(resource, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    },
    
    async getTransaction(txid) {
        try {
            const [txRes, txStatusRes] = await Promise.all([
                this.fetchWithTimeout(`https://blockstream.info/api/tx/${txid}`),
                this.fetchWithTimeout(`https://blockstream.info/api/tx/${txid}/status`)
            ]);
            
            const tx = txRes;
            tx.status = txStatusRes;
            
            return tx;
        } catch (error) {
            console.error('Errore nel recupero della transazione:', error);
            throw new Error('Transazione non trovata o errore di rete');
        }
    },
    
    async getAddress(address) {
        try {
            const [addrRes, txsRes, priceRes] = await Promise.all([
                this.fetchWithTimeout(`https://blockstream.info/api/address/${address}`),
                this.fetchWithTimeout(`https://blockstream.info/api/address/${address}/txs`),
                this.fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
            ]);
            
            return { 
                addrInfo: addrRes, 
                txs: txsRes, 
                priceData: priceRes 
            };
        } catch (error) {
            console.error('Errore nel recupero dell\'indirizzo:', error);
            throw new Error('Indirizzo non trovato o errore di rete');
        }
    },
    
    async getBlock(blockQuery) {
        try {
            let blockHash = blockQuery;
            
            if (/^\d+$/.test(blockQuery)) {
                blockHash = await this.fetchWithTimeout(`https://blockstream.info/api/block-height/${blockQuery}`);
            }
            
            const [blockRes, txsRes] = await Promise.all([
                this.fetchWithTimeout(`https://blockstream.info/api/block/${blockHash}`),
                this.fetchWithTimeout(`https://blockstream.info/api/block/${blockHash}/txs`)
            ]);
            
            return { 
                block: blockRes, 
                txs: txsRes, 
                blockHash 
            };
        } catch (error) {
            console.error('Errore nel recupero del blocco:', error);
            throw new Error('Blocco non trovato o errore di rete');
        }
    },
    
    async getNetworkStats() {
        try {
            const [blockRes, mempoolRes, priceRes, diffRes] = await Promise.all([
                this.fetchWithTimeout('https://blockstream.info/api/blocks/tip/height'),
                this.fetchWithTimeout('https://blockstream.info/api/mempool'),
                this.fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
                this.fetchWithTimeout('https://blockstream.info/api/blocks/tip')
            ]);
            
            return {
                blockHeight: blockRes,
                mempool: mempoolRes,
                price: priceRes,
                difficulty: diffRes.difficulty
            };
        } catch (error) {
            console.error('Errore nel recupero delle statistiche:', error);
            throw new Error('Impossibile recuperare i dati di rete');
        }
    },
    
    async getHistoricalPrices(days = 30) {
        try {
            const data = await this.fetchWithTimeout(
                `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
            );
            
            return data.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp).toLocaleDateString(),
                price
            }));
        } catch (error) {
            console.error('Errore nel recupero dei prezzi storici:', error);
            throw new Error('Impossibile recuperare i dati storici');
        }
    }
};

// Renderer migliorato con paginazione e sicurezza
const renderer = {
    currentPage: 1,
    itemsPerPage: 10,
    
    transaction(tx) {
        let html = `<h2>Dettagli Transazione</h2>`;
        
        // Basic info
        html += this.renderDataRow('TXID:', tx.txid, true);
        html += this.renderDataRow('Stato:', tx.status.confirmed ? 
            `<span class="badge confirmed">Confermato</span> (Blocco #${tx.status.block_height})` : 
            `<span class="badge unconfirmed">Non confermato</span>`);
        
        if (tx.status.confirmed) {
            html += this.renderDataRow('Conferme:', utils.formatNumber(tx.status.block_height));
        }
        
        html += this.renderDataRow('Data/Ora:', tx.status.confirmed ? 
            new Date(tx.status.block_time * 1000).toLocaleString() : 
            'In mempool (non confermato)');
        
        html += this.renderDataRow('Dimensione:', `${utils.formatNumber(tx.size)} bytes`);
        
        // Calcolo fee se disponibile
        if (tx.vin && tx.vout) {
            const inputSum = tx.vin.reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0);
            const outputSum = tx.vout.reduce((sum, vout) => sum + vout.value, 0);
            const fee = inputSum - outputSum;
            
            if (fee > 0) {
                html += this.renderDataRow('Fee:', `${utils.formatBTC(fee)} (${utils.formatNumber(fee)} satoshi)`);
                html += this.renderDataRow('Tasso di fee:', `${(fee / tx.size).toFixed(2)} satoshi/byte`);
            }
        }
        
        // Pulsante preferiti
        html += `<button class="button secondary" onclick="saveFavorite('tx', '${security.html(tx.txid)}', 'TX ${utils.shortenHash(tx.txid)}')">
            ★ Salva nei Preferiti
        </button>`;
        
        // Input e Output con tabs
        html += `<div class="tabs">
            <div class="tab active" onclick="switchTab('inputs', 'outputs')">Input (${tx.vin.length})</div>
            <div class="tab" onclick="switchTab('outputs', 'inputs')">Output (${tx.vout.length})</div>
        </div>`;
        
        // Input Tab
        html += `<div id="inputs" class="tab-content active"><ul class="list">`;
        tx.vin.forEach((vin, i) => {
            const address = vin.prevout?.scriptpubkey_address || 'Coinbase (generazione nuova moneta)';
            const value = vin.prevout?.value ? utils.formatBTC(vin.prevout.value) : 'N/A';
            
            html += `<li class="list-item">
                <strong>Input #${i + 1}:</strong> 
                ${address.startsWith('Coinbase') ? security.html(address) : 
                    `<a href="#" class="tx-link" onclick="performSearchAddress('${security.url(address)}')">${security.html(address)}</a>`}
                - ${security.html(value)}
                ${vin.txid ? `<br><small>Da TX: <a href="#" class="tx-link" onclick="performSearchTx('${security.url(vin.txid)}')">${utils.shortenHash(vin.txid)}</a></small>` : ''}
            </li>`;
        });
        html += `</ul></div>`;
        
        // Output Tab
        html += `<div id="outputs" class="tab-content"><ul class="list">`;
        tx.vout.forEach((vout, i) => {
            const address = vout.scriptpubkey_address || 'N/A (script non standard)';
            html += `<li class="list-item">
                <strong>Output #${i + 1}:</strong> 
                ${address === 'N/A (script non standard)' ? security.html(address) : 
                    `<a href="#" class="tx-link" onclick="performSearchAddress('${security.url(address)}')">${security.html(address)}</a>`}
                - ${utils.formatBTC(vout.value)}
            </li>`;
        });
        html += `</ul></div>`;
        
        return html;
    },
    
    address(data, address) {
        const { addrInfo, txs, priceData } = data;
        
        const confirmedBalance = (addrInfo.chain_stats.funded_txo_sum - addrInfo.chain_stats.spent_txo_sum) / 1e8;
        const unconfirmedBalance = (addrInfo.mempool_stats.funded_txo_sum - addrInfo.mempool_stats.spent_txo_sum) / 1e8;
        const totalReceived = addrInfo.chain_stats.funded_txo_sum / 1e8;
        const totalSent = addrInfo.chain_stats.spent_txo_sum / 1e8;
        
        const usdValue = priceData ? (confirmedBalance * priceData.bitcoin.usd).toLocaleString() : null;
        
        let html = `<h2>Dettagli Indirizzo</h2>`;
        
        // QR Code e Indirizzo
        html += `<div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:${security.url(address)}" 
                     alt="QR Code per ${security.html(address)}" width="200" height="200">
            </div>
            <div style="flex:1; min-width:200px;">
                ${this.renderDataRow('Indirizzo:', security.html(address), true)}
                
                <div class="balance-highlight">
                    <span class="btc-symbol">₿</span> ${confirmedBalance.toFixed(8)} BTC
                    ${usdValue ? `<small>($${security.html(usdValue)} USD)</small>` : ''}
                </div>
        `;
        
        if (unconfirmedBalance !== 0) {
            html += this.renderDataRow('Non confermato:', `<span class="btc-symbol">₿</span> ${unconfirmedBalance.toFixed(8)} BTC`);
        }
        
        // Pulsante preferiti
        html += `<button class="button secondary" onclick="saveFavorite('address', '${security.html(address)}', 'Indirizzo ${utils.shortenHash(address)}')" style="margin-top:10px;">
            ★ Salva nei Preferiti
        </button>`;
        
        // Chiudi sezione QR code
        html += `</div></div>`;
        
        // Sezione statistiche
        html += `<div class="advanced-options">
            <h3>Statistiche Indirizzo</h3>
            ${this.renderDataRow('Totale Ricevuto:', `<span class="btc-symbol">₿</span> ${totalReceived.toFixed(8)} BTC`)}
            ${this.renderDataRow('Totale Speso:', `<span class="btc-symbol">₿</span> ${totalSent.toFixed(8)} BTC`)}
            ${this.renderDataRow('Conteggio Transazioni:', utils.formatNumber(addrInfo.chain_stats.tx_count + addrInfo.mempool_stats.tx_count))}
        </div>`;
        
        // Mostra transazioni recenti con paginazione
        html += `<h3>Transazioni Recenti</h3>`;
        
        if (txs.length === 0) {
            html += `<p>Nessuna transazione trovata</p>`;
        } else {
            const paginated = utils.paginate(txs, this.currentPage, this.itemsPerPage);
            
            html += `<ul class="list">`;
            paginated.items.forEach(tx => {
                const isOutgoing = tx.vin.some(vin => vin.prevout?.scriptpubkey_address === address);
                const amount = isOutgoing ? 
                    tx.vout.reduce((sum, v) => sum + (v.scriptpubkey_address !== address ? v.value : 0), 0) :
                    tx.vout.reduce((sum, v) => sum + (v.scriptpubkey_address === address ? v.value : 0), 0);
                
                html += `<li class="list-item">
                    <span class="badge ${isOutgoing ? 'unconfirmed' : 'confirmed'}">${isOutgoing ? 'Inviato' : 'Ricevuto'}</span>
                    <a href="#" class="tx-link" onclick="performSearchTx('${security.url(tx.txid)}')">${utils.shortenHash(tx.txid)}</a>
                    (<span class="btc-symbol">₿</span> ${utils.formatBTC(amount)})
                    ${tx.status.confirmed ? 
                        `<small>${new Date(tx.status.block_time * 1000).toLocaleDateString()}</small>` : 
                        '<small>In mempool</small>'}
                </li>`;
            });
            html += `</ul>`;
            
            // Pulsanti paginazione
            if (paginated.totalPages > 1) {
                html += `<div class="pagination">`;
                if (paginated.currentPage > 1) {
                    html += `<button onclick="nextPage(${paginated.currentPage - 1})">Indietro</button>`;
                }
                if (paginated.currentPage < paginated.totalPages) {
                    html += `<button onclick="nextPage(${paginated.currentPage + 1})">Avanti</button>`;
                }
                html += `</div>`;
            }
        }
        
        return html;
    },
    
    block(data) {
        const { block, txs, blockHash } = data;
        
        let html = `<h2>Dettagli Blocco</h2>`;
        
        // Informazioni base blocco
        html += this.renderDataRow('Altezza:', utils.formatNumber(block.height));
        html += this.renderDataRow('Hash:', blockHash, true);
        html += this.renderDataRow('Data/Ora:', new Date(block.timestamp * 1000).toLocaleString());
        html += this.renderDataRow('Conteggio Transazioni:', utils.formatNumber(block.tx_count));
        html += this.renderDataRow('Dimensione:', `${utils.formatNumber(block.size)} bytes`);
        html += this.renderDataRow('Difficoltà:', utils.formatNumber(Math.round(block.difficulty)));
        html += this.renderDataRow('Versione:', `0x${block.version.toString(16)}`);
        html += this.renderDataRow('Merkle Root:', block.merkle_root);
        
        // Pulsante preferiti
        html += `<button class="button secondary" onclick="saveFavorite('block', '${security.html(blockHash)}', 'Blocco ${block.height}')">
            ★ Salva nei Preferiti
        </button>`;
        
        // Transazioni recenti nel blocco con paginazione
        html += `<h3>Transazioni Recenti</h3>`;
        
        if (txs.length === 0) {
            html += `<p>Nessuna transazione disponibile</p>`;
        } else {
            const paginated = utils.paginate(txs, this.currentPage, this.itemsPerPage);
            
            html += `<ul class="list">`;
            paginated.items.forEach(tx => {
                html += `<li class="list-item">
                    <a href="#" class="tx-link" onclick="performSearchTx('${security.url(tx.txid)}')">${utils.shortenHash(tx.txid)}</a>
                    (<span class="btc-symbol">₿</span> ${utils.formatBTC(tx.vout.reduce((sum, v) => sum + v.value, 0))})
                </li>`;
            });
            html += `</ul>`;
            
            // Pulsanti paginazione
            if (paginated.totalPages > 1) {
                html += `<div class="pagination">`;
                if (paginated.currentPage > 1) {
                    html += `<button onclick="nextPage(${paginated.currentPage - 1})">Indietro</button>`;
                }
                if (paginated.currentPage < paginated.totalPages) {
                    html += `<button onclick="nextPage(${paginated.currentPage + 1})">Avanti</button>`;
                }
                html += `</div>`;
            }
        }
        
        return html;
    },
    
    dashboard(stats) {
        const { blockHeight, mempool, price, difficulty } = stats;
        
        return `
            <h2>Dashboard Rete Bitcoin</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Altezza Blocco Corrente</h3>
                    <div class="stat-value">${utils.formatNumber(blockHeight)}</div>
                </div>
                
                <div class="stat-card">
                    <h3>Dimensione Mempool</h3>
                    <div class="stat-value">${utils.formatNumber(mempool.count)} tx</div>
                </div>
                
                <div class="stat-card">
                    <h3>Prezzo Bitcoin</h3>
                    <div class="stat-value">$${price.bitcoin.usd.toLocaleString()}</div>
                </div>
                
                <div class="stat-card">
                    <h3>Difficoltà Rete</h3>
                    <div class="stat-value">${utils.formatNumber(Math.round(difficulty))}</div>
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="networkChart"></canvas>
            </div>
        `;
    },
    
    favorites(favorites) {
        if (!favorites || favorites.length === 0) return '';
        
        let html = `<div class="favorites-section">
            <h3>Preferiti Salvati</h3>
            <ul class="list">`;
        
        favorites.slice(0, 50).forEach(fav => { // Limite a 50 elementi
            html += `<li class="list-item">
                <a href="#" onclick="loadFavorite('${security.url(fav.type)}', '${security.url(fav.id)}')">${security.html(fav.label)}</a>
                <small>(${security.html(fav.type)}, ${new Date(fav.date).toLocaleDateString()})</small>
                <button class="remove-btn" onclick="removeFavorite('${security.url(fav.id)}', event)">✕</button>
            </li>`;
        });
        
        html += `</ul></div>`;
        return html;
    },
    
    renderDataRow(label, value, copyable = false) {
        let copyBtn = '';
        if (copyable) {
            copyBtn = `<button class="copy-btn" onclick="utils.copyToClipboard('${security.html(value.replace(/'/g, "\\'"))}')">Copia</button>`;
        }
        
        return `<div class="data-row">
            <div class="data-label">${security.html(label)}</div>
            <div class="data-value">${value} ${copyBtn}</div>
        </div>`;
    },
    
    async renderNetworkChart() {
        const ctx = document.getElementById('networkChart')?.getContext('2d');
        if (!ctx) return;
        
        try {
            const historicalData = await api.getHistoricalPrices(30);
            const labels = historicalData.map(item => item.date);
            const prices = historicalData.map(item => item.price);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Prezzo Bitcoin (USD)',
                        data: prices,
                        borderColor: 'rgba(247, 147, 26, 1)',
                        backgroundColor: 'rgba(247, 147, 26, 0.1)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Storico Prezzo Bitcoin (Ultimi 30 giorni)'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Errore nel rendering del grafico:', error);
        }
    }
};

// Sistema Preferiti con limite
const favorites = {
    maxFavorites: 50, // Limite massimo di preferiti
    
    get() {
        try {
            return JSON.parse(localStorage.getItem('bitcoinFavorites') || '[]');
        } catch (e) {
            console.error('Errore nel recupero dei preferiti:', e);
            return [];
        }
    },
    
    save(type, id, label) {
        const currentFavorites = this.get();
        
        // Controlla se esiste già
        const exists = currentFavorites.some(fav => fav.id === id);
        if (exists) {
            utils.showToast('Questo elemento è già nei tuoi preferiti', 'warning');
            return false;
        }
        
        // Controlla il limite
        if (currentFavorites.length >= this.maxFavorites) {
            utils.showToast(`Limite di ${this.maxFavorites} preferiti raggiunto. Rimuovi alcuni preferiti prima di aggiungerne nuovi.`, 'error');
            return false;
        }
        
        // Aggiungi il nuovo preferito
        currentFavorites.push({
            type,
            id,
            label: label || `${type} ${id.substring(0, 10)}...`,
            date: new Date().toISOString()
        });
        
        localStorage.setItem('bitcoinFavorites', JSON.stringify(currentFavorites));
        utils.showToast('Aggiunto ai preferiti!', 'success');
        return true;
    },
    
    remove(id) {
        const updatedFavorites = this.get().filter(fav => fav.id !== id);
        localStorage.setItem('bitcoinFavorites', JSON.stringify(updatedFavorites));
        utils.showToast('Rimosso dai preferiti', 'success');
        return updatedFavorites;
    },
    
    clear() {
        localStorage.removeItem('bitcoinFavorites');
        utils.showToast('Tutti i preferiti sono stati rimossi', 'success');
    }
};

function toggleDashboard() {
  const dashboard = document.getElementById("dashboard");
  const resultDiv = document.getElementById("result");

  if (!dashboard) return;

  if (dashboard.style.display === "none" || dashboard.style.display === "") {
    dashboard.style.display = "block";
    resultDiv.style.display = "none"; // nascondi i risultati principali
    loadDashboard(); // carica contenuto
  } else {
    dashboard.style.display = "none";
    resultDiv.style.display = "block"; // mostra i risultati principali
  }
}

async function loadDashboard() {
  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = '<div class="loader"></div><p style="text-align:center;">Caricamento dashboard...</p>';

  try {
    const stats = await api.getNetworkStats(); // usa la tua funzione già presente
    dashboard.innerHTML = renderer.dashboard(stats); // visualizza
    renderer.renderNetworkChart(); // mostra il grafico (già esistente)
  } catch (err) {
    dashboard.innerHTML = `
      <div class="error-message">
        <p>Impossibile caricare i dati della dashboard.</p>
        <button onclick="loadDashboard()">Riprova</button>
      </div>
    `;
    console.error("Errore nel caricamento della dashboard:", err);
  }
}

async function performSearch() {
    const type = document.getElementById('searchType').value;
    const query = document.getElementById('searchInput').value.trim();
    const resultDiv = document.getElementById('result');
    const originalContent = resultDiv.innerHTML;
    
    try {
        // Resetta la paginazione
        renderer.currentPage = 1;
        
        // Valida l'input
        if (!query) throw new Error('Per favore inserisci un valore valido');
        validator[type](query);
        
        // Mostra stato di caricamento
        resultDiv.innerHTML = '<div class="loader"></div><p style="text-align:center;">Caricamento dati...</p>';
        
        // Controlla la cache prima
        const cacheKey = `${type}:${query}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            renderResult(type, cachedData.value, query);
            return;
        }
        
        // Recupera i dati dall'API
        let data;
        switch (type) {
            case 'tx':
                data = await api.getTransaction(query);
                break;
            case 'address':
                data = await api.getAddress(query);
                break;
            case 'block':
                data = await api.getBlock(query);
                break;
            default:
                throw new Error('Tipo di ricerca non valido');
        }
        
        // Memorizza nella cache
        cache.set(cacheKey, data);
        
        // Renderizza il risultato
        renderResult(type, data, query);
        
    } catch (err) {
        resultDiv.innerHTML = originalContent;
        utils.showToast(err.message, 'error');
        console.error(err);
    }
}

function renderResult(type, data, query) {
    const resultDiv = document.getElementById('result');
    
    switch (type) {
        case 'tx':
            resultDiv.innerHTML = renderer.transaction(data);
            break;
        case 'address':
            resultDiv.innerHTML = renderer.address(data, query);
            break;
        case 'block':
            resultDiv.innerHTML = renderer.block(data);
            break;
        default:
            resultDiv.innerHTML = '<p>Tipo di risultato non valido</p>';
    }
    
    // Mostra la sezione preferiti
    const favs = favorites.get();
    if (favs.length > 0) {
        resultDiv.insertAdjacentHTML('beforeend', renderer.favorites(favs));
    }
    
    // Se è il dashboard, renderizza il grafico
    if (type === 'dashboard') {
        setTimeout(() => renderer.renderNetworkChart(), 500);
    }
}

// Funzioni helper per le interazioni UI
function performSearchTx(txid) {
    document.getElementById('searchType').value = 'tx';
    document.getElementById('searchInput').value = txid;
    performSearch();
}

function performSearchAddress(address) {
    document.getElementById('searchType').value = 'address';
    document.getElementById('searchInput').value = address;
    performSearch();
}

function switchTab(showId, hideId) {
    document.getElementById(showId).classList.add('active');
    document.getElementById(hideId).classList.remove('active');
    
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.textContent.includes(showId.charAt(0).toUpperCase() + showId.slice(1))) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function nextPage(page) {
    renderer.currentPage = page;
    performSearch(); // Ricarica con la nuova pagina
}

function saveFavorite(type, id, label) {
    if (favorites.save(type, id, label)) {
        // Aggiorna la visualizzazione dei preferiti
        const favs = favorites.get();
        const favSection = document.querySelector('.favorites-section');
        if (favSection) {
            favSection.innerHTML = renderer.favorites(favs);
        } else {
            document.getElementById('result').insertAdjacentHTML('beforeend', renderer.favorites(favs));
        }
    }
}

function loadFavorite(type, id) {
    document.getElementById('searchType').value = type;
    document.getElementById('searchInput').value = id;
    performSearch();
}

function removeFavorite(id, event) {
    event.stopPropagation(); // Previene il click sul link
    const updatedFavorites = favorites.remove(id);
    
    // Aggiorna la visualizzazione
    const favSection = document.querySelector('.favorites-section');
    if (favSection) {
        favSection.innerHTML = renderer.favorites(updatedFavorites);
    }
}

// Inizializza l'app
async function initApp() {
    // Carica la dashboard di default
    try {
        const stats = await api.getNetworkStats();
        document.getElementById('result').innerHTML = renderer.dashboard(stats);
        renderer.renderNetworkChart();
    } catch (err) {
        console.error('Errore nel caricamento della dashboard:', err);
        document.getElementById('result').innerHTML = `
            <div class="error-message">
                <p>Impossibile caricare i dati della rete. Controlla la tua connessione e riprova.</p>
                <button onclick="initApp()">Riprova</button>
            </div>
        `;
    }
    
    // Imposta i listener degli eventi
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });
    
    document.getElementById('clearCache').addEventListener('click', () => {
        cache.clear();
        utils.showToast('Cache svuotata', 'success');
    });
    
    document.getElementById('clearFavorites').addEventListener('click', () => {
        favorites.clear();
        const favSection = document.querySelector('.favorites-section');
        if (favSection) favSection.remove();
    });
}

// Avvia l'app quando il DOM è caricato
document.addEventListener('DOMContentLoaded', initApp);
