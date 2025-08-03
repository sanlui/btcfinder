async function displayResults(data, type, query, container) {
  if (type === 'address') {
    // Ottieni sia il saldo che le transazioni complete
    const [balance, transactions] = await Promise.all([
      getAddressBalance(query),
      getAddressTransactions(query)
    ]);
    
    // Processa le transazioni per separare incoming/outgoing
    const processedTxs = processTransactions(transactions, query);
    
    container.innerHTML = `
      <div class="address-details">
        <h2>Address Details</h2>
        <div class="address-info">
          <div class="address-info-row">
            <div class="address-label">Address:</div>
            <div class="address-value monospace">${query}</div>
          </div>
          <div class="address-info-row">
            <div class="address-label">Balance:</div>
            <div class="address-value">${balance} BTC</div>
          </div>
        </div>
        
        <div class="transactions-section">
          <div class="transactions-tabs">
            <button class="tab-btn active" data-tab="all">All Transactions</button>
            <button class="tab-btn" data-tab="incoming">Received</button>
            <button class="tab-btn" data-tab="outgoing">Sent</button>
          </div>
          
          <div class="transactions-list">
            ${renderTransactionList(processedTxs.all)}
          </div>
          
          <div class="transactions-list hidden" id="incoming-txs">
            ${renderTransactionList(processedTxs.incoming)}
          </div>
          
          <div class="transactions-list hidden" id="outgoing-txs">
            ${renderTransactionList(processedTxs.outgoing)}
          </div>
        </div>
      </div>
    `;
    
    setupTabHandlers();
  }
}

// Nuove funzioni helper
function processTransactions(txs, address) {
  const result = {
    all: [],
    incoming: [],
    outgoing: []
  };

  txs.forEach(tx => {
    // Calcola il valore netto per questo indirizzo
    let value = 0;
    let isIncoming = false;

    // Controlla gli output (ricevuti)
    tx.vout.forEach(output => {
      if (output.scriptpubkey_address === address) {
        value += output.value;
        isIncoming = true;
      }
    });

    // Controlla gli input (spesi)
    tx.vin.forEach(input => {
      if (input.prevout && input.prevout.scriptpubkey_address === address) {
        value -= input.prevout.value;
        isIncoming = false;
      }
    });

    const txData = {
      txid: tx.txid,
      value: value / 100000000, // Converti in BTC
      isIncoming,
      time: tx.status.block_time,
      block: tx.status.block_height
    };

    result.all.push(txData);
    if (isIncoming) {
      result.incoming.push(txData);
    } else {
      result.outgoing.push(txData);
    }
  });

  return result;
}

function renderTransactionList(transactions) {
  if (transactions.length === 0) {
    return '<p class="no-txs">No transactions found</p>';
  }

  return `
    <ul>
      ${transactions.map(tx => `
        <li class="transaction-item ${tx.isIncoming ? 'incoming' : 'outgoing'}">
          <div class="tx-hash">
            <a href="#" class="tx-link" data-txid="${tx.txid}">
              ${tx.txid.substring(0, 20)}...
            </a>
          </div>
          <div class="tx-value ${tx.isIncoming ? 'positive' : 'negative'}">
            ${tx.isIncoming ? '+' : '-'}${Math.abs(tx.value).toFixed(8)} BTC
          </div>
          <div class="tx-time">
            ${tx.block ? `Block: ${tx.block}` : 'Unconfirmed'}
          </div>
        </li>
      `).join('')}
    </ul>
  `;
}

function setupTabHandlers() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      document.querySelectorAll('.transactions-list').forEach(list => {
        list.classList.add('hidden');
      });
      
      const tabType = this.dataset.tab;
      const tabElement = tabType === 'all' ? 
        document.querySelector('.transactions-list') : 
        document.getElementById(`${tabType}-txs`);
      
      tabElement.classList.remove('hidden');
    });
  });
}
