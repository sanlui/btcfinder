<!DOCTYPE html>
<html>
<head>
  <title>Generatore Wallet Bitcoin</title>
  <script src="https://unpkg.com/bitcoinjs-lib@6.1.0"></script>
</head>
<body>

  <h2>Generatore Wallet Bitcoin</h2>

  <p><strong>Indirizzo:</strong> <span id="address">Caricamento...</span></p>
  <p><strong>Chiave privata (WIF):</strong> <span id="privateKey">Caricamento...</span></p>
  <button onclick="generateWallet()">Genera Nuovo Wallet</button>

  <script>
    function generateWallet() {
      const bitcoin = window.bitcoinjs;
      const keyPair = bitcoin.ECPair.makeRandom();
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      const privateKey = keyPair.toWIF();

      document.getElementById('address').innerText = address;
      document.getElementById('privateKey').innerText = privateKey;
    }

    // Genera subito un wallet al caricamento
    generateWallet();
  </script>
</body>
</html>
