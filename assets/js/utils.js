export function formatBTC(satoshi) {
  return (satoshi / 1e8).toFixed(8) + ' BTC';
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function shortenHash(hash) {
  return hash.length > 20 ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}` : hash;
}

export function copyToClipboard(text, elementId = 'copy-feedback') {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(elementId);
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    }
  });
}