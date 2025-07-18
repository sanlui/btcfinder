// Genera wallet BTC usando bitcoinjs-lib
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

// Aggancia il bottone al click
document.getElementById('generateBtn').addEventListener('click', updateWallet);

// Genera un wallet all'apertura pagina
updateWallet();
