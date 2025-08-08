document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const copyButtons = document.querySelectorAll('.copy-btn');
  
  // Generate testnet address
  generateBtn.addEventListener('click', async () => {
    try {
      // Generate keypair
      const network = bitcoin.networks.testnet; // Using testnet for safety
      const keyPair = bitcoin.ECPair.makeRandom({ network });
      
      // Get WIF and address
      const wif = keyPair.toWIF();
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network
      });
      
      // Update UI
      document.getElementById('address').textContent = address;
      document.getElementById('privateKey').textContent = wif;
      document.getElementById('balance').textContent = '0 BTC (testnet)';
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Error generating address. Please try again.');
    }
  });
  
  // Copy functionality
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const text = document.getElementById(targetId).textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>';
        setTimeout(() => {
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z"/></svg>';
        }, 2000);
      });
    });
  });
});
