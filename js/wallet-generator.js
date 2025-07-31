async function generateWallet() {
    try {
        const keyPair = bitcoin.ECPair.makeRandom();
        const { address } = bitcoin.payments.p2pkh({ 
            pubkey: keyPair.publicKey,
            network: bitcoin.networks.bitcoin
        });
        const privateKeyWIF = keyPair.toWIF();

        // Mostra le informazioni del wallet
        document.getElementById('address').textContent = address;
        document.getElementById('privateKey').textContent = privateKeyWIF;
        document.getElementById('balance').textContent = "Caricamento...";
        document.getElementById('walletInfo').style.display = 'block';

        // Genera QR code
        if(typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.getElementById('qrCode'), address, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) console.error(error);
            });
        } else {
            console.warn("QRCode library non disponibile");
        }

        // Recupera il saldo
        const response = await fetch(`https://blockstream.info/api/address/${address}`);
        if (!response.ok) {
            throw new Error("Errore nella richiesta API saldo");
        }
        const data = await response.json();

        const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
        document.getElementById('balance').textContent = balance.toFixed(8) + " BTC";

    } catch (e) {
        console.error('Errore nella generazione/verifica:', e);
        throw e; // Rilancia l'errore per gestirlo nell'HTML principale
    }
}
