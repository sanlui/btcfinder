function generateWallet() {
  try {
    // Controlla che bitcoinjs-lib sia caricato correttamente
    if (typeof bitcoinjs === "undefined") {
      throw new Error("bitcoinjs-lib non caricato correttamente");
    }

    // Genera una nuova coppia di chiavi casuale
    const keyPair = bitcoinjs.ECPair.makeRandom();

    // Genera l'indirizzo Bitcoin P2PKH (legacy)
    const { address } = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey });

    // Ottieni la chiave privata in formato WIF (Wallet Import Format)
    const privateKeyWIF = keyPair.toWIF();

    // Aggiorna il contenuto HTML con l'indirizzo e la chiave privata
    document.getElementById('btc-address').textContent = address;
    document.getElementById('btc-private').textContent = privateKeyWIF;

  } catch (e) {
    console.error('Errore nella generazione del wallet:', e);
    alert('Errore nella generazione del wallet. Controlla la console per dettagli.');
  }
}
