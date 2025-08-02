const bitcoin = bitcoinjsLib;

function generateWallet() {
    const network = bitcoin.networks.bitcoin;
    const keyPair = bitcoin.ECPair.makeRandom({ network });
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });
    const privateKey = keyPair.toWIF();

    $('#address').text(address);
    $('#privateKey').text(privateKey);
    $('#result').show();
    $('#balance').text('0.00000000');
}
