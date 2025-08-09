document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM
    const dom = {
        generationMethod: document.getElementById('generationMethod'),
        mnemonicPhrase: document.getElementById('mnemonicPhrase'),
        customEntropy: document.getElementById('customEntropy'),
        derivationPath: document.getElementById('derivationPath'),
        customPath: document.getElementById('customPath'),
        generateBtn: document.getElementById('generateWallet'),
        walletResults: document.querySelector('.wallet-results'),
        bitcoinAddress: document.getElementById('bitcoinAddress'),
        publicKey: document.getElementById('publicKey'),
        privateKey: document.getElementById('privateKey'),
        mnemonicDisplay: document.getElementById('mnemonicDisplay'),
        mnemonicDisplayText: document.getElementById('mnemonicDisplayText'),
        addressQr: document.getElementById('addressQr'),
        privateQr: document.getElementById('privateQr'),
        showQrPrivateBtn: document.getElementById('showQrPrivate')
    };

    // Inizializzazione
    initEventListeners();

    function initEventListeners() {
        // Cambio metodo di generazione
        dom.generationMethod.addEventListener('change', function() {
            document.getElementById('mnemonicOptions').style.display = 
                this.value === 'mnemonic' ? 'block' : 'none';
            document.getElementById('entropyOptions').style.display = 
                this.value === 'entropy' ? 'block' : 'none';
        });
        
        // Cambio percorso di derivazione
        dom.derivationPath.addEventListener('change', function() {
            dom.customPath.classList.toggle('hidden', this.value !== 'custom');
        });
        
        // Genera wallet
        dom.generateBtn.addEventListener('click', generateWallet);
        
        // Pulsanti copia
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', copyToClipboard);
        });
        
        // Mostra/nascondi QR privato
        if (dom.showQrPrivateBtn) {
            dom.showQrPrivateBtn.addEventListener('click', togglePrivateQR);
        }
    }

    async function generateWallet() {
        try {
            // 1. Ottieni i parametri
            const method = dom.generationMethod.value;
            const network = document.querySelector('input[name="network"]:checked').value;
            const path = dom.derivationPath.value === 'custom' ? dom.customPath.value : dom.derivationPath.value;

            // 2. Genera il seed
            let mnemonic, seed;
            
            if (method === 'random') {
                mnemonic = bip39.generateMnemonic(256); // 24 parole
                seed = await bip39.mnemonicToSeed(mnemonic);
            } 
            else if (method === 'mnemonic') {
                mnemonic = dom.mnemonicPhrase.value.trim();
                if (!bip39.validateMnemonic(mnemonic)) {
                    throw new Error('Frase mnemonica non valida');
                }
                seed = await bip39.mnemonicToSeed(mnemonic);
            }
            else if (method === 'entropy') {
                const entropy = dom.customEntropy.value.trim();
                if (!/^[0-9a-fA-F]{64}$/.test(entropy)) {
                    throw new Error('Entropy deve essere una stringa esadecimale di 64 caratteri');
                }
                mnemonic = bip39.entropyToMnemonic(entropy);
                seed = await bip39.mnemonicToSeed(mnemonic);
            }

            // 3. Deriva il wallet
            const root = bitcoin.bip32.fromSeed(seed, getNetwork(network));
            const child = root.derivePath(path);
            
            // 4. Genera indirizzo
            const { address } = bitcoin.payments.p2wpkh({ 
                pubkey: child.publicKey,
                network: getNetwork(network)
            });

            // 5. Mostra risultati
            displayResults({
                address,
                publicKey: child.publicKey.toString('hex'),
                privateKey: child.toWIF(),
                mnemonic: (method === 'random' || method === 'entropy') ? mnemonic : null
            });

        } catch (error) {
            console.error('Errore nella generazione:', error);
            alert(`Errore: ${error.message}`);
        }
    }

    function getNetwork(network) {
        return network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    }

    function displayResults({ address, publicKey, privateKey, mnemonic }) {
        // Mostra dati wallet
        dom.bitcoinAddress.textContent = address;
        dom.publicKey.textContent = publicKey;
        dom.privateKey.textContent = privateKey;
        
        // Mostra/nascondi mnemonico
        if (mnemonic) {
            dom.mnemonicDisplayText.textContent = mnemonic;
            dom.mnemonicDisplay.classList.remove('hidden');
        } else {
            dom.mnemonicDisplay.classList.add('hidden');
        }
        
        // Genera QR code
        generateQR('addressQr', address);
        
        // Mostra sezione risultati
        dom.walletResults.classList.remove('hidden');
        dom.walletResults.scrollIntoView({ behavior: 'smooth' });
    }

    function generateQR(elementId, data) {
        const element = document.getElementById(elementId);
        element.innerHTML = '';
        new QRCode(element, {
            text: data,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    function copyToClipboard(e) {
        const target = e.target.getAttribute('data-target');
        const text = document.getElementById(target).textContent;
        navigator.clipboard.writeText(text).then(() => {
            // Feedback visivo
            const originalText = e.target.textContent;
            e.target.textContent = 'Copiato!';
            setTimeout(() => {
                e.target.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Errore nella copia:', err);
        });
    }

    function togglePrivateQR() {
        const qrElement = dom.privateQr;
        qrElement.classList.toggle('hidden');
        
        if (!qrElement.classList.contains('hidden')) {
            generateQR('privateQr', dom.privateKey.textContent);
        }
    }
});
