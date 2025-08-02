const bitcoin = window.bitcoinjsLib;
if (!bitcoin) {
  console.error("bitcoinjs-lib non è stato caricato correttamente");
  document.getElementById('generateBtn').disabled = true;
}

document.getElementById('generateBtn').addEventListener('click', function() {
  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Generazione in corso...';

  setTimeout(() => {
    try {
      const network = bitcoin.networks.bitcoin;
      const keyPair = bitcoin.ECPair.makeRandom({ network });

      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: network
      });

      const privateKey = keyPair.toWIF();

      document.getElementById('address').textContent = address;
      document.getElementById('privateKey').textContent = privateKey;
      document.getElementById('result').style.display = 'block';

      QRCode.toCanvas(document.getElementById('addressQr'), address, { width: 150 });
      QRCode.toCanvas(document.getElementById('privateKeyQr'), privateKey, { width: 150 });

    } catch (error) {
      console.error("Errore:", error);
      alert("Si è verificato un errore durante la generazione: " + error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Genera Nuovo Indirizzo BTC';
    }
  }, 100);
});

function copyToClipboard(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('Testo copiato negli appunti!');
  }).catch(err => {
    console.error('Errore durante la copia:', err);
    alert('Impossibile copiare il testo');
  });
}
