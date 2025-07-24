function generateWallet() {
  const keyPair = bitcoin.ECPair.makeRandom();
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
  const privateKeyWIF = keyPair.toWIF();

  document.getElementById("btc-address").innerText = address;
  document.getElementById("btc-private").innerText = privateKeyWIF;
}
