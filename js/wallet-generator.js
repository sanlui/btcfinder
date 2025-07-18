<script src="https://cdn.jsdelivr.net/npm/bitcoinjs-lib@6.1.0/dist/bitcoinjs.min.js"></script>
<script>
  function generateWallet() {
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const wif = keyPair.toWIF();
    return { address, wif };
  }

  function updateWallet() {
    const wallet = generateWallet();
    document.getElementById('btcAddress').textContent = wallet.address;
    document.getElementById('btcWIF').textContent = wallet.wif;
  }

  document.getElementById('generateBtn').addEventListener('click', updateWallet);

  // Genera un wallet appena si carica la pagina
  updateWallet();
</script>
