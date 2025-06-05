
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'tradingbot/public')));

// Redirect root to trading dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'tradingbot/public/index.html'));
});

// Import and use trading bot routes
const tradingServer = require('./tradingbot/server.js');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`📈 Trading Dashboard available at http://0.0.0.0:${PORT}`);
});
