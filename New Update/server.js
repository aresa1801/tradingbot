// server.js FINAL - SIGNAL SCAN STABILIZED
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const ccxt = require('ccxt');
const ti = require('technicalindicators');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb+srv://adityarahadhyan:Zd3Fc4B9ubvTvGgX@tradingbot.suc6ed4.mongodb.net/?retryWrites=true&w=majority&appName=Tradingbot')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB error:', err.message);
});
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

const tradeSchema = new mongoose.Schema({
  symbol: String,
  side: String,
  price: Number,
  amount: Number,
  timestamp: Date,
  signal: String,
  profit: Number,
  status: String
});
const Trade = mongoose.model('Trade', tradeSchema);

let userExchange = null;
let botRunning = false;
let allowedPairs = [];

app.get('/api/ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.json({ ip });
});

// ✅ Fungsi scanning market langsung setelah connect
async function scanAndGenerateSignals() {
  if (!userExchange || !allowedPairs.length) return;
  console.log("🔍 Scanning market for signals...");
    for (const symbol of allowedPairs) {

    try {
      const ohlcv = await userExchange.fetchOHLCV(symbol, '15m');
      const closes = ohlcv.map(c => c[4]);
      const rsi = ti.RSI.calculate({ values: closes, period: 14 }).slice(-1)[0];

      if (rsi < 45 || rsi > 55) {
        await Trade.create({
          symbol,
          side: rsi < 30 ? 'BUY' : 'SELL',
          price: closes[closes.length - 1],
          amount: 0,
          timestamp: new Date(),
          signal: 'AI-SCAN',
          profit: 0,
          status: 'signal-only'
        });
        console.log(`📍 Signal ${rsi < 30 ? 'BUY' : 'SELL'} for ${symbol} (RSI: ${rsi.toFixed(2)})`);
      }
    } catch (err) {
      console.warn(`⚠️ Scan error for ${symbol}:`, err.message);
    }
  }
}

app.post('/api/connect', async (req, res) => {
  const { exchange, apiKey, secretKey } = req.body;
  try {
    if (!exchange || typeof ccxt[exchange] !== 'function') {
      return res.status(400).json({ success: false, error: 'Exchange tidak dikenali' });
    }
    const Exchange = ccxt[exchange];
    userExchange = new Exchange({
      apiKey,
      secret: secretKey,
      enableRateLimit: true,
      options: { defaultType: 'spot' },
      sandboxMode: false
    });
    if (userExchange.setSandboxMode) userExchange.setSandboxMode(false);
    await userExchange.loadMarkets();
    console.log('✅ Connected to', exchange);
    console.log('✅ Available pairs:', Object.keys(userExchange.markets).slice(0, 5));

    allowedPairs = exchange === 'indodax'
      ? Object.keys(userExchange.markets).filter(p => p.endsWith('/IDR'))
      : Object.keys(userExchange.markets).filter(p => p.endsWith('/USDT'));

    res.json({ success: true, allowedPairs });

    // 🧠 Jalankan scan setelah koneksi siap & MongoDB terhubung
    setTimeout(() => {
  if (mongoose.connection.readyState === 1) {
    scanAndGenerateSignals();
    setInterval(scanAndGenerateSignals, 10 * 60 * 1000); // every 10 minutes
      } else {
        console.warn('⚠️ Skip scan — MongoDB not ready');
      }
    }, 1000);

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/allowed-pairs', (req, res) => res.json({ pairs: allowedPairs }));
app.get('/api/bot/status', (req, res) => res.json({ running: botRunning }));
app.post('/api/bot/start', (req, res) => (botRunning = true, res.json({ success: true })));
app.post('/api/bot/stop', (req, res) => (botRunning = false, res.json({ success: true })));

app.get('/api/balance', async (req, res) => {
  try {
    const balance = await userExchange.fetchBalance();
    console.log('🔗 Balance Fetched:', balance.total);
    const currency = userExchange.id === 'indodax' ? 'IDR' : 'USDT';
    res.json({ balance: balance.total[currency] || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil balance: ' + err.message });
  }
});

app.get('/api/trades', async (req, res) => {
  try {
    const trades = await Trade.find().sort({ timestamp: -1 }).limit(50);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil riwayat trade: ' + err.message });
  }
});

app.post('/api/order', async (req, res) => {
  const { symbol, side, amount } = req.body;
  try {
    if (!userExchange) throw new Error('Belum terhubung exchange');
    if (!symbol || !side || !amount) throw new Error('Input tidak lengkap');
    const order = await userExchange.createOrder(symbol, 'market', side.toLowerCase(), amount);
    const price = order.price || (await userExchange.fetchTicker(symbol)).last;

    await Trade.create({
      symbol,
      side: side.toUpperCase(),
      price,
      amount,
      timestamp: new Date(),
      signal: 'MANUAL',
      profit: 0,
      status: 'executed'
    });
    res.json({ success: true, order });
  } catch (err) {
    console.error('Order Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
