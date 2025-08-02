// Assumiamo che bitcoinjs-lib sia già caricato come bitcoinjsLib
const bitcoin = bitcoinjsLib;

document.getElementById('generateBtn').addEventListener('click', function () {
  try {
    const network = bitcoin.networks.bitcoin;
    const keyPair = bitcoin.ECPair.makeRandom({ network });

    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network
    });

    const privateKey = keyPair.toWIF();

    document.getElementById('address').textContent = address;
    document.getElementById('privateKey').textContent = privateKey;
    document.getElementById('result').style.display = 'block';
    document.getElementById('balance').textContent = '0.00000000'; // statico per ora

  } catch (error) {
    console.error("Errore:", error);
    alert("Si è verificato un errore: " + error.message);
  }
});
