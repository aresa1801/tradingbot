const axios = require('axios');
require('dotenv').config();

// Config
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const INTERVAL_MINUTES = 5;
const symbols = process.env.TRADE_SYMBOLS?.split(',') || [];

if (symbols.length === 0) {
  console.error('❌ Tidak ada simbol yang dikonfigurasi di .env');
  process.exit(1);
}

// Fungsi analisis dengan timeout
async function analyzeSymbol(symbol) {
  try {
    const response = await axios.get(`${API_BASE_URL}/analyze/${symbol}`, {
      timeout: 10000 // 10 detik timeout
    });

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response structure');
    }

    const { scalping_signal = 'HOLD', ai_signal = 'HOLD', last_price } = response.data;

    console.log(`\n[${new Date().toLocaleTimeString()}] ${symbol.toUpperCase()}`);
    console.log('├─ Signal Teknikal:', scalping_signal);
    console.log('├─ Signal AI:', ai_signal);
    console.log('└─ Harga:', last_price);

    return { symbol, scalping_signal, ai_signal, last_price };

  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error ${symbol}:`, error.message);
    return null;
  }
}

// Eksekusi analisis paralel
async function runAnalysis() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Memulai analisis...`);

  const results = await Promise.all(
    symbols.map(symbol => analyzeSymbol(symbol))
  );

  // Filter hasil yang valid
  const validResults = results.filter(Boolean);
  console.log(`\n📊 Summary: ${validResults.length}/${symbols.length} sukses`);
}

// Main execution
function main() {
  console.log('🤖 AutoTrader diaktifkan');
  console.log(`🔎 Memantau: ${symbols.join(', ')}`);
  console.log(`⏰ Interval: ${INTERVAL_MINUTES} menit`);

  // Jalankan segera, lalu setiap interval
  runAnalysis();
  setInterval(runAnalysis, INTERVAL_MINUTES * 60 * 1000);
}

main();