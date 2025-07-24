// Assicurati che bitcoinjs sia caricato come script nel tuo HTML

function generateWallet() {
  // Crea una nuova coppia di chiavi random
  const keyPair = bitcoin.ECPair.makeRandom();

  // Genera l'indirizzo Bitcoin P2PKH (legacy)
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

  // Ottieni la chiave privata in formato WIF (Wallet Import Format)
  const privateKeyWIF = keyPair.toWIF();

  // Mostra i valori nel DOM
  document.getElementById('btc-address').textContent = address;
  document.getElementById('btc-private').textContent = privateKeyWIF;
}
