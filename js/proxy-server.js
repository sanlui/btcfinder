const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();

// Configura CORS
app.use(cors({
  origin: ['https://btcfinder.xyz', 'http://localhost:3000']
}));

// Limita le richieste a 10/minuto per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});
app.use(limiter);

// Endpoint proxy
app.get('/api/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const response = await axios.get(`https://blockchain.info/rawaddr/${address}?limit=50`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
});

// Avvia il server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
