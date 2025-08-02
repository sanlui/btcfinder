function generateWallet() {
  // Genera una nuova chiave privata e indirizzo BTC
  const keyPair = bitcoin.ECPair.makeRandom();
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
  const privateKey = keyPair.toWIF();

  document.getElementById("btc-address").textContent = address;
  document.getElementById("btc-private").textContent = privateKey;
}
