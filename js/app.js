document.addEventListener('DOMContentLoaded', () => {
    // Configurazione
    const NETWORKS = {
        mainnet: bitcoin.networks.bitcoin,
        testnet: bitcoin.networks.testnet
    };

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
        mnemonicDisplayText: document.getElementById('mnemonicDisplayText')
    };

    // Inizializzazione
    initEventListeners();

    function initEventListeners() {
        dom.generateBtn.addEventListener('click', generateWallet);

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', copyToClipboard);
        });

        document.getElementById('showQrPrivate').addEventListener('click', togglePrivateQR);
    }

    async function generateWallet() {
        try {
            const method = dom.generationMethod.value;
            const network = document.querySelector('input[name="network"]:checked').value;
            const path = dom.derivationPath.value === 'custom' ? dom.customPath.value : dom.derivationPath.value;

            let mnemonic, seed;

            if (method === 'random') {
                mnemonic = bip39.generateMnemonic(256);
                seed = await bip39.mnemonicToSeed(mnemonic);
            } else if (method === 'mnemonic') {
                mnemonic = dom.mnemonicPhrase.value.trim();
                if (!bip39.validateMnemonic(mnemonic)) {
                    throw new Error('Frase mnemonica non valida');
                }
                seed = await bip39.mnemonicToSeed(mnemonic);
            } else if (method === 'entropy') {
                const entropy = dom.customEntropy.value.trim();
                if (!/^[0-9a-fA-F]{64}$/.test(entropy)) {
                    throw new Error('Entropy deve essere una stringa esadecimale di 64 caratteri');
                }
                mnemonic = bip39.entropyToMnemonic(entropy);
                seed = await bip39.mnemonicToSeed(mnemonic);
            }

            const root = bitcoin.bip32.fromSeed(seed, NETWORKS[network]);
            const child = root.derivePath(path);

            const { address } = bitcoin.payments.p2wpkh({
                pubkey: child.publicKey,
                network: NETWORKS[network]
            });

            displayResults({
                address,
                publicKey: child.publicKey.toString('hex'),
                privateKey: child.toWIF(),
                mnemonic: (method === 'random' || method === 'entropy') ? mnemonic : null
            });

        } catch (error) {
            console.error('Errore generazione wallet:', error);
            alert(`Errore: ${error.message}`);
        }
    }

    function displayResults({ address, publicKey, privateKey, mnemonic }) {
        dom.bitcoinAddress.textContent = address;
        dom.publicKey.textContent = publicKey;
        dom.privateKey.textContent = privateKey;

        dom.mnemonicDisplayText.textContent = mnemonic || '';
        dom.mnemonicDisplay.classList.remove('hidden');

        generateQR('addressQr', address);

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
        navigator.clipboard.writeText(text)
            .then(() => {
                e.target.textContent = 'Copiato!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Errore durante la copia:', err);
            });
    }

    function togglePrivateQR() {
        const qrElement = document.getElementById('privateQr');
        const btn = document.getElementById('showQrPrivate');

        if (qrElement.classList.contains('hidden')) {
            generateQR('privateQr', dom.privateKey.textContent);
            btn.textContent = 'Nascondi QR Privato';
        } else {
            btn.textContent = 'Mostra QR Privato';
        }

        qrElement.classList.toggle('hidden');
    }
});
