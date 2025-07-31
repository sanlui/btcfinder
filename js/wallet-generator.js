// wallet-generator.js

// Importa le librerie necessarie (assicurati di includerle nel tuo HTML)
// bitcoinjs-lib e qrcode.js devono essere caricati prima di questo script

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza il generatore al caricamento della pagina
    initWalletGenerator();
});

function initWalletGenerator() {
    // Aggiungi event listener al pulsante di generazione
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateWallet);
    }
    
    // Se vuoi generare un wallet automaticamente all'avvio:
    // generateWallet();
}

async function generateWallet() {
    try {
        // Mostra lo stato di caricamento
        toggleLoadingState(true);
        
        // Genera una nuova coppia di chiavi
        const keyPair = bitcoin.ECPair.makeRandom();
        
        // Genera l'indirizzo P2PKH (Pay-to-Public-Key-Hash)
        const { address } = bitcoin.payments.p2pkh({ 
            pubkey: keyPair.publicKey,
            network: bitcoin.networks.bitcoin // Specifica la rete Bitcoin
        });
        
        // Converti la chiave privata in formato WIF (Wallet Import Format)
        const privateKeyWIF = keyPair.toWIF();
        
        // Aggiorna l'interfaccia utente con i dati del wallet
        updateWalletUI(address, privateKeyWIF);
        
        // Genera il QR code per l'indirizzo
        await generateQRCode(address);
        
        // Recupera il saldo dall'API di Blockstream
        await fetchBalance(address);
        
    } catch (error) {
        console.error('Errore nella generazione del wallet:', error);
        showError('Si è verificato un errore durante la generazione del wallet. Controlla la console per i dettagli.');
    } finally {
        // Nascondi lo stato di caricamento
        toggleLoadingState(false);
    }
}

function updateWalletUI(address, privateKeyWIF) {
    // Mostra la sezione delle informazioni del wallet
    const walletInfo = document.getElementById('walletInfo');
    if (walletInfo) {
        walletInfo.style.display = 'block';
    }
    
    // Aggiorna i campi con i dati del wallet
    const addressElement = document.getElementById('address');
    if (addressElement) {
        addressElement.textContent = address;
    }
    
    const privateKeyElement = document.getElementById('privateKey');
    if (privateKeyElement) {
        privateKeyElement.textContent = privateKeyWIF;
    }
    
    // Resetta il saldo durante la generazione di un nuovo wallet
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.textContent = "Caricamento...";
    }
}

async function generateQRCode(address) {
    try {
        const qrCodeElement = document.getElementById('qrCode');
        if (qrCodeElement) {
            // Pulisci il contenuto precedente
            qrCodeElement.innerHTML = '';
            
            // Genera il nuovo QR code
            await QRCode.toCanvas(qrCodeElement, address, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
        }
    } catch (error) {
        console.error('Errore nella generazione del QR code:', error);
    }
}

async function fetchBalance(address) {
    try {
        const balanceElement = document.getElementById('balance');
        if (!balanceElement) return;
        
        // Effettua la richiesta all'API di Blockstream
        const response = await fetch(`https://blockstream.info/api/address/${address}`);
        
        if (!response.ok) {
            throw new Error(`Errore API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Calcola il saldo (satoshis to BTC)
        const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
        
        // Aggiorna l'UI con il saldo
        balanceElement.textContent = `${balance.toFixed(8)} BTC`;
        
    } catch (error) {
        console.error('Errore nel recupero del saldo:', error);
        const balanceElement = document.getElementById('balance');
        if (balanceElement) {
            balanceElement.textContent = "Errore nel recupero del saldo";
        }
    }
}

function toggleLoadingState(isLoading) {
    const generateBtn = document.getElementById('generateBtn');
    if (!generateBtn) return;
    
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = 'Generazione in corso... <i class="bi-arrow-repeat ms-2 spin"></i>';
    } else {
        generateBtn.disabled = false;
        generateBtn.innerHTML = 'Genera Nuovo Wallet <i class="bi-arrow-repeat ms-2"></i>';
    }
}

function showError(message) {
    // Puoi implementare una migliore visualizzazione degli errori
    alert(message);
}

// Stili per l'icona di caricamento
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
