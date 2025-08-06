const CACHE_NAME = 'btc-explorer-v1';
const BASE_PATH = '/bitcoin-explorer/';
const OFFLINE_URL = `${BASE_PATH}404.html`;

const ASSETS = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}css/styles.css`,
  `${BASE_PATH}js/main.js`,
  `${BASE_PATH}js/worker.js`,
  OFFLINE_URL
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});
