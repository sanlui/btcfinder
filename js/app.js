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
        // Cambio metodo di generazione
        dom.generationMethod.addEventListener('change', function() {
            document.getElementById('mnemonicOptions').style.display = 
                this.value === 'mnemonic' ? 'block' : 'none';
            document.getElementById('entropyOptions').style.display = 
                this.value === 'entropy' ? 'block' : 'none';
        });
        
        // Cambio percorso di derivazione
        dom.derivationPath.addEventListener('change', function() {
            dom.customPath.style.display = this.value === 'custom' ? 'block' : 'none';
        });
        
        // Genera wallet
        dom.generateBtn.addEventListener('click', generateWallet);
        
        // Pulsanti copia
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', copyToClipboard);
        });
        
        // Mostra/nascondi QR privato
        document.getElementById('showQrPrivate').addEventListener('click', togglePrivateQR);
    }

    async function generateWallet() {
        try {
            // Mostra un loader (opzionale)
            dom.generateBtn.disabled = true;
            dom.generateBtn.textContent = 'Generazione in corso...';

            // 1. Ottieni i parametri
            const method = dom.generationMethod.value;
            const network = document.querySelector('input[name="network"]:checked').value;
            const path = dom.derivationPath.value === 'custom' ? dom.customPath.value : dom.derivationPath.value;

            // 2. Genera il seed
            let mnemonic, seed;
            
            if (method === 'random') {
                mnemonic = bip39.generateMnemonic(256); // 256 bits = 24 parole
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
                    throw new Error('Entropia deve essere una stringa esadecimale di 64 caratteri (32 bytes)');
                }
                mnemonic = bip39.entropyToMnemonic(entropy);
                seed = await bip39.mnemonicToSeed(mnemonic);
            }

            // 3. Deriva il wallet
            const root = bitcoin.bip32.fromSeed(seed, NETWORKS[network]);
            const child = root.derivePath(path);
            
            // 4. Genera indirizzo
            const { address } = bitcoin.payments.p2wpkh({ 
                pubkey: child.publicKey,
                network: NETWORKS[network]
            });

            // 5. Mostra risultati
            displayResults({
                address,
                publicKey: child.publicKey.toString('hex'),
                privateKey: child.toWIF(),
                mnemonic: (method === 'random' || method === 'entropy') ? mnemonic : null
            });

        } catch (error) {
            console.error('Errore generazione wallet:', error);
            alert(`Errore: ${error.message}`);
        } finally {
            // Ripristina il pulsante
            dom.generateBtn.disabled = false;
            dom.generateBtn.textContent = 'Genera Portafoglio';
        }
    }

    // ... (resto del codice rimane uguale)
});
