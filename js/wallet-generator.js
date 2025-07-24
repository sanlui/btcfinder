function generateWallet() {
  try {
    const bitcoin = window.bitcoinjs; // PRIMA definisci bitcoin correttamente
    if (!bitcoin) throw new Error("bitcoinjs-lib non caricato correttamente");

    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKeyWIF = keyPair.toWIF();

    document.getElementById('btc-address').textContent = address;
    document.getElementById('btc-private').textContent = privateKeyWIF;
  } catch (e) {
    console.error('Errore nella generazione del wallet:', e);
    alert('Errore nella generazione del wallet. Controlla la console per dettagli.');
  }
}
