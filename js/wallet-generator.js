function generateWallet() {
  const keyPair = bitcoinjs.ECPair.makeRandom();
  const { address } = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey });
  const wif = keyPair.toWIF();

  document.getElementById('btc-address').textContent = address;
  document.getElementById('btc-wif').textContent = wif;
}

// Genera un wallet all'avvio
generateWallet();

// Collega il bottone al generatore
document.getElementById('generate-btn').addEventListener('click', generateWallet);

