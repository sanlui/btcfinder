async function generateWallet() {
  try {
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKeyWIF = keyPair.toWIF();

    // Aggiorno gli ID presenti nell'HTML
    document.getElementById('address').textContent = address;
    document.getElementById('privateKey').textContent = privateKeyWIF;

    let balanceSpan = document.getElementById('balance');
    balanceSpan.textContent = "Caricamento...";

    const response = await fetch(`https://blockstream.info/api/address/${address}`);
    if (!response.ok) {
      throw new Error("Errore nella richiesta API saldo");
    }
    const data = await response.json();

    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
    balanceSpan.textContent = balance + " BTC";

  } catch (e) {
    console.error('Errore nella generazione/verifica:', e);
    alert("Errore: guarda la console per i dettagli.");
  }
}
