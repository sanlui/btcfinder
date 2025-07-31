async function generateWallet() {
  try {
    // 1. Genera chiave e indirizzo
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKeyWIF = keyPair.toWIF();

    // 2. Mostra indirizzo e chiave
    document.getElementById('btc-address').textContent = address;
    document.getElementById('btc-private').textContent = privateKeyWIF;

    // 3. Mostra saldo in caricamento o crea l'elemento saldo se non esiste
    let balanceSpan = document.getElementById('btc-balance');
    if (!balanceSpan) {
      const balanceEl = document.createElement("p");
      balanceEl.innerHTML = `<strong>Saldo:</strong> <span id="btc-balance" class="text-success">Caricamento...</span>`;
      document.querySelector(".card").appendChild(balanceEl);
      balanceSpan = document.getElementById('btc-balance');
    } else {
      balanceSpan.textContent = "Caricamento...";
    }

    // 4. Chiamata API per controllare il saldo
    const response = await fetch(`https://blockstream.info/api/address/${address}`);
    if (!response.ok) {
      throw new Error("Errore nella richiesta API saldo");
    }
    const data = await response.json();

    // 5. Calcola saldo in BTC
    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;

    // 6. Mostra saldo
    balanceSpan.textContent = balance + " BTC";

  } catch (e) {
    console.error('Errore nella generazione/verifica:', e);
    alert("Errore: guarda la console per i dettagli.");
  }
}
