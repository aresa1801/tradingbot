// server.js FINAL - RSI + MACD + EMA + BB + Auto-Trade

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

const Trade = mongoose.model('Trade', new mongoose.Schema({
  symbol: String,
  side: String,
  price: Number,
  amount: Number,
  timestamp: Date,
  signal: String,
  profit: Number,
  status: String
}));

let userExchange = null;
let botRunning = false;

const allowedPairs = [
  'SOL/IDR', 'SUI/IDR', 'ONDO/IDR', 'TURBO/IDR', 'PEPE/IDR',
  'ETH/IDR', 'XRP/IDR', 'BNB/IDR', 'AVAX/IDR', 'HBAR/IDR',
  'PYTH/IDR', 'BTC/IDR', 'ENA/IDR', 'FET/IDR', 'INJ/IDR',
  'UNI/IDR', 'AAVE/IDR', 'TIA/IDR', 'WLD/IDR', 'PENDLE/IDR'
];

// API for connecting to the exchange
app.post('/api/connect', async (req, res) => {
  const { exchange, apiKey, secretKey } = req.body;
  try {
    const Exchange = ccxt[exchange];
    userExchange = new Exchange({
      apiKey,
      secret: secretKey,
      enableRateLimit: true,
      options: { defaultType: 'spot' }
    });
    if (userExchange.setSandboxMode) userExchange.setSandboxMode(false);
    await userExchange.loadMarkets();
    console.log('✅ Connected to', exchange);
    res.json({ success: true });

    setTimeout(() => {
      if (mongoose.connection.readyState === 1) {
        scanAndAutoTrade();
        setInterval(scanAndAutoTrade, 10 * 60 * 1000);  // scan every 10 minutes
      }
    }, 1000);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Function to scan and trade
async function scanAndAutoTrade() {
  if (!userExchange || !botRunning) return;

  console.log("📡 Scanning with full indicators...");
  for (const symbol of allowedPairs) {
    try {
      await new Promise(r => setTimeout(r, 30000)); // Throttle requests every 30 seconds
      const ohlcv = await userExchange.fetchOHLCV(symbol, '5m');  // 5-minute candlesticks
      const closes = ohlcv.map(c => c[4]);

      // Calculate indicators
      const rsi = ti.RSI.calculate({ values: closes, period: 14 }).at(-1);
      const ema = ti.EMA.calculate({ values: closes, period: 21 }).at(-1);
      const macd = ti.MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      }).at(-1);
      const bb = ti.BollingerBands.calculate({
        period: 20,
        stdDev: 2,
        values: closes
      }).at(-1);

      // Log the indicators for debugging
      console.log(`RSI: ${rsi.toFixed(2)}, MACD: ${macd.MACD.toFixed(2)}, EMA: ${ema.toFixed(2)}, BB Lower: ${bb.lower.toFixed(2)}, BB Upper: ${bb.upper.toFixed(2)}`);

      const price = closes.at(-1);
      const belowBB = price < bb.lower;
      const aboveBB = price > bb.upper;
      const isMACDBuy = macd.MACD > macd.signal && macd.MACD < 0;
      const isMACDSell = macd.MACD < macd.signal && macd.MACD > 0;
      const side = (rsi < 45 && isMACDBuy && price > ema && belowBB) ? 'BUY'
                  : (rsi > 55 && isMACDSell && price < ema && aboveBB) ? 'SELL'
                  : null;

      // If a signal is found, execute the trade
      if (side) {
        const amount = 100_000 / price;  // Example trade amount
        const order = await userExchange.createOrder(symbol, 'market', side.toLowerCase(), amount);

        // Save the trade to the database
        await Trade.create({
          symbol, side, price,
          amount, signal: 'AUTO-AI',
          profit: 0,
          status: 'executed',
          timestamp: new Date()
        });

        console.log(`🚨 AUTO-TRADE: ${side} ${symbol} @ ${price.toFixed(2)} | RSI: ${rsi.toFixed(2)}`);
      }
    } catch (err) {
      console.warn(`⚠️ Signal error for ${symbol}: ${err.message}`);
    }
  }
}

// Start and stop bot endpoints
app.post('/api/bot/start', (req, res) => {
  botRunning = true;
  res.json({ success: true });
});
app.post('/api/bot/stop', (req, res) => {
  botRunning = false;
  res.json({ success: true });
});
app.get('/api/bot/status', (req, res) => res.json({ running: botRunning }));

// API for fetching balance (Ensuring it syncs with Indodax)
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await userExchange.fetchBalance();  // Fetch balance from the exchange
    console.log("Fetched Balance:", balance);  // Log the entire balance object for debugging

    const currency = userExchange.id === 'indodax' ? 'IDR' : 'USDT';
    res.json({ balance: balance.total[currency] || 0 });  // Send balance in the correct currency (IDR or USDT)
  } catch (err) {
    console.error("Error fetching balance:", err);
    res.status(500).json({ error: err.message });
  }
});

// API for fetching trades
app.get('/api/trades', async (req, res) => {
  try {
    const trades = await Trade.find().sort({ timestamp: -1 }).limit(50);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export app for use in main server
module.exports = app;

// Only start server if this file is run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running at http://0.0.0.0:${PORT}`));
}
