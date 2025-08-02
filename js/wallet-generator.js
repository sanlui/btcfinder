// Usa l'oggetto globale corretto (bitcoin, non bitcoinjs)
const bitcoin = window.bitcoin || window.bitcoinjsLib;

if (!bitcoin) {
  console.error("bitcoinjs-lib non è stato caricato correttamente");
  document.getElementById('generateBtn').disabled = true;
  alert("Errore: La libreria bitcoinjs-lib non è stata caricata correttamente");
}

document.getElementById('generateBtn').addEventListener('click', function() {
  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Generazione in corso...';

  setTimeout(() => {
    try {
      // Verifica che la libreria sia disponibile
      if (!bitcoin || !bitcoin.networks || !bitcoin.ECPair) {
        throw new Error("Libreria bitcoinjs non completamente caricata");
      }

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

      // Genera QR code solo se la libreria QRCode è disponibile
      if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(document.getElementById('addressQr'), address, { width: 150 });
        QRCode.toCanvas(document.getElementById('privateKeyQr'), privateKey, { width: 150 });
      } else {
        console.warn("Libreria QRCode non disponibile");
      }

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
