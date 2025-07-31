async function generateWallet() {
    try {
        // Verifica che bitcoinjs-lib sia disponibile
        if(typeof bitcoin === 'undefined') {
            throw new Error("La libreria BitcoinJS non è disponibile");
        }

        const keyPair = bitcoin.ECPair.makeRandom();
        const { address } = bitcoin.payments.p2pkh({ 
            pubkey: keyPair.publicKey,
            network: bitcoin.networks.bitcoin
        });
        const privateKeyWIF = keyPair.toWIF();

        // Aggiorna l'UI
        document.getElementById('address').textContent = address;
        document.getElementById('privateKey').textContent = privateKeyWIF;
        document.getElementById('balance').textContent = "Caricamento...";
        document.getElementById('walletInfo').style.display = 'block';

        // Genera QR Code se la libreria è disponibile
        if(typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.getElementById('qrCode'), address, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) console.error('Errore QR Code:', error);
            });
        }

        // Recupera il saldo
        const response = await fetch(`https://blockstream.info/api/address/${address}`);
        if (!response.ok) throw new Error("Errore API: " + response.status);
        
        const data = await response.json();
        const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
        document.getElementById('balance').textContent = balance.toFixed(8) + " BTC";

    } catch (error) {
        console.error('Errore generazione wallet:', error);
        throw error; // Rilancia per gestione nell'HTML
    }
}
