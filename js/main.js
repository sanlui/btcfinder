function displayAddressData(data) {
  // Popola i dati principali
  document.getElementById('address-hash').textContent = data.address;
  document.getElementById('address-balance').textContent = data.final_balance + ' BTC';
  document.getElementById('total-transactions').textContent = data.n_tx;
  document.getElementById('total-received').textContent = data.total_received + ' BTC';
  document.getElementById('total-sent').textContent = data.total_sent + ' BTC';
  document.getElementById('final-balance').textContent = data.final_balance + ' BTC';
  document.getElementById('transactions-count').textContent = data.txs.length + ' transazioni';

  // Popola le transazioni
  const transactionsList = document.getElementById('transactions-list');
  transactionsList.innerHTML = '';

  data.txs.forEach(tx => {
    const txItem = document.createElement('li');
    txItem.className = 'transaction-item';
    
    txItem.innerHTML = `
      <a href="/tx/${tx.hash}" class="tx-hash-link">${tx.hash}</a>
      <div class="tx-details-grid">
        <div class="tx-io-box">
          <div class="stat-title">Input</div>
          ${tx.inputs.map(input => `
            <div class="tx-address">${input.prev_out.addr}</div>
            <div class="tx-amount out">-${input.prev_out.value} BTC</div>
          `).join('')}
        </div>
        <div class="tx-io-box">
          <div class="stat-title">Output</div>
          ${tx.out.map(output => `
            <div class="tx-address">${output.addr}</div>
            <div class="tx-amount">+${output.value} BTC</div>
          `).join('')}
        </div>
      </div>
      <div class="tx-confirmations">${tx.block_height ? (currentBlockHeight - tx.block_height + 1) + ' conferme' : 'Non confermato'}</div>
    `;
    
    transactionsList.appendChild(txItem);
  });
}
