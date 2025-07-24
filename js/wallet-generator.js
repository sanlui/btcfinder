// wallet-generator.js

function generateWallet() {
  // Usa direttamente l'oggetto bitcoin caricato da CDN
  const keyPair = bitcoin.ECPair.makeRandom();

  // Genera l'indirizzo Bitcoin P2PKH (legacy)
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

  // Ottieni la chiave privata in formato WIF (Wallet Import Format)
  const privateKeyWIF = keyPair.toWIF();

  // Mostra indirizzo e chiave privata nel DOM
  document.getElementById("btc-address").innerText = address;
  document.getElementById("btc-private").innerText = privateKeyWIF;
}
