// Configurazione
const NETWORKS = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet
};

// Elementi DOM
const generationMethod = document.getElementById('generationMethod');
const mnemonicPhrase = document.getElementById('mnemonicPhrase');
const customEntropy = document.getElementById('customEntropy');
const networkRadios = document.querySelectorAll('input[name="network"]');
const derivationPath = document.getElementById('derivationPath');
const customPath = document.getElementById('customPath');
const generateBtn = document.getElementById('generateWallet');
const walletResults = document.querySelector('.wallet-results');

// Genera un nuovo wallet
async function generateWallet() {
  try {
    // 1. Ottieni i parametri
    const method = generationMethod.value;
    const network = document.querySelector('input[name="network"]:checked').value;
    const path = derivationPath.value === 'custom' ? customPath.value : derivationPath.value;

    // 2. Genera il seed
    let mnemonic, seed;
    
    if (method === 'random') {
      mnemonic = bip39.generateMnemonic(256); // 24 parole
      seed = await bip39.mnemonicToSeed(mnemonic);
    } 
    else if (method === 'mnemonic') {
      mnemonic = mnemonicPhrase.value.trim();
      if (!bip39.validateMnemonic(mnemonic)) {
        alert('Mnemonic phrase invalid!');
        return;
      }
      seed = await bip39.mnemonicToSeed(mnemonic);
    }
    else if (method === 'entropy') {
      const entropy = customEntropy.value.trim();
      mnemonic = bip39.entropyToMnemonic(entropy);
      seed = await bip39.mnemonicToSeed(mnemonic);
    }

    // 3. Deriva il wallet
    const root = bitcoin.bip32.fromSeed(seed, NETWORKS[network]);
    const child = root.derivePath(path);
    
    // 4. Genera gli indirizzi
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network: NETWORKS[network]
    });

    // 5. Mostra i risultati
    document.getElementById('bitcoinAddress').textContent = address;
    document.getElementById('publicKey').textContent = child.publicKey.toString('hex');
    document.getElementById('privateKey').textContent = child.toWIF();
    
    if (method === 'random' || method === 'entropy') {
      document.getElementById('mnemonicDisplayText').textContent = mnemonic;
      document.getElementById('mnemonicDisplay').classList.remove('hidden');
    } else {
      document.getElementById('mnemonicDisplay').classList.add('hidden');
    }

    // Genera QR Code
    generateQR('addressQr', address);
    
    // Mostra la sezione risultati
    walletResults.classList.remove('hidden');
    walletResults.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Error:', error);
    alert('Error generating wallet: ' + error.message);
  }
}

// Genera QR Code
function generateQR(elementId, data) {
  const element = document.getElementById(elementId);
  element.innerHTML = '';
  QRCode.toCanvas(element, data, {
    width: 150,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

// Event Listeners
generateBtn.addEventListener('click', generateWallet);

// Mostra/nascondi campi in base al metodo
generationMethod.addEventListener('change', function() {
  document.getElementById('mnemonicOptions').style.display = 
    this.value === 'mnemonic' ? 'block' : 'none';
  document.getElementById('entropyOptions').style.display = 
    this.value === 'entropy' ? 'block' : 'none';
});

// Mostra/nascondi percorso personalizzato
derivationPath.addEventListener('change', function() {
  customPath.classList.toggle('hidden', this.value !== 'custom');
});

// Copia negli appunti
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const target = this.getAttribute('data-target');
    navigator.clipboard.writeText(document.getElementById(target).textContent);
    this.textContent = 'Copied!';
    setTimeout(() => this.textContent = 'Copy', 2000);
  });
});

// Mostra QR privato
document.getElementById('showQrPrivate').addEventListener('click', function() {
  const qr = document.getElementById('privateQr');
  qr.classList.toggle('hidden');
  if (!qr.classList.contains('hidden')) {
    generateQR('privateQr', document.getElementById('privateKey').textContent);
  }
});
