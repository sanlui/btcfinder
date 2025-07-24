// Assumiamo che bitcoinjs-lib sia già caricato tramite CDN nel tuo HTML

function generateWallet() {
  try {
    // genera una coppia di chiavi random
    const keyPair = bitcoin.ECPair.makeRandom();

    // genera indirizzo Bitcoin P2PKH (legacy)
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

    // chiave privata in formato WIF
    const privateKeyWIF = keyPair.toWIF();

    // mostra nel DOM
    document.getElementById('btc-address').textContent = address;
    document.getElementById('btc-private').textContent = privateKeyWIF;
  } catch (e) {
    console.error('Errore nella generazione del wallet:', e);
    alert('Errore nella generazione del wallet. Controlla la console per dettagli.');
  }
}
