async function generateWallet() {
  try {
    // 1. Genera chiave e indirizzo
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKeyWIF = keyPair.toWIF();

    // 2. Mostra indirizzo e chiave
    document.getElementById('btc-address').textContent = address;
    document.getElementById('btc-private').textContent = privateKeyWIF;

    // 3. Mostra saldo in caricamento
    let balanceSpan = document.getElementById('btc-balance');
    if (!balanceSpan) {
      // Se non esiste, lo creiamo
      const balanceEl = document.createElement("p");
      balanceEl.innerHTML = `<strong>Saldo:</strong> <span id="btc-balance" class="text-success">Caricamento...</span>`;
      document.querySelector(".card").appendChild(balanceEl);
    } else {
      balanceSpan.textContent = "Caricamento...";
    }

    // 4. Controlla saldo da Blockstream.info
    const response = await fetch(`https://blockstream.info/api/address/${address}`);
    const data = await response.json();
    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;

    // 5. Mostra saldo finale
    document.getElementById('btc-balance').textContent = balance + " BTC";

  } catch (e) {
    console.error('Errore nella generazione/verifica:', e);
    alert("Errore: guarda la console per i dettagli.");
  }
}
