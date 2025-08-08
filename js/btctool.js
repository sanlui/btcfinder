document.getElementById('generateBtn').addEventListener('click', async () => {
    // 1. Genera chiave privata casuale
    const network = bitcoin.networks.bitcoin; // Rete Bitcoin mainnet
    const privateKey = bitcoin.ECPair.makeRandom({ network }).privateKey;
    const wif = bitcoin.ECPair.fromPrivateKey(privateKey).toWIF();

    // 2. Genera indirizzo BTC (formato SegWit)
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: bitcoin.ECPair.fromPrivateKey(privateKey).publicKey,
        network,
    });

    // 3. Genera seed mnemonico (opzionale)
    const mnemonic = bip39.entropyToMnemonic(privateKey.toString('hex').slice(0, 32));

    // Mostra i dati nella pagina
    document.getElementById('address').textContent = address;
    document.getElementById('privateKey').textContent = wif;
    document.getElementById('balance').textContent = "Caricamento...";

    // 4. Controlla il saldo (usa API pubblica)
    try {
        const response = await fetch(`https://blockchain.info/balance?active=${address}`);
        const data = await response.json();
        const balance = data[address].final_balance / 100000000; // Converti da satoshi a BTC
        document.getElementById('balance').textContent = `${balance} BTC`;
    } catch (error) {
        document.getElementById('balance').textContent = "Errore nel caricamento";
    }
});
