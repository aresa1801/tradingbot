const axios = require('axios');
require('dotenv').config();

// Ambil simbol dari .env
const symbols = process.env.TRADE_SYMBOLS.split(',');

// Fungsi analisis satu simbol
async function analyzeSymbol(symbol) {
  try {
    const response = await axios.get(`http://localhost:3000/analyze/${symbol}`);
    const data = response.data;

    console.log(`\n[${new Date().toLocaleTimeString()}] Analisis Selesai: ${symbol}`);
    console.log(`Signal Teknikal: ${data.scalping_signal || 'HOLD'}`);
    console.log(`Signal AI: ${data.ai_signal || 'HOLD'}`);
    console.log(`Harga Terakhir: ${data.last_price}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error pada ${symbol}: ${error.message}`);
  }
}

// Jalankan analisis semua simbol
async function runAnalysis() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔁 Memulai Analisis Otomatis`);
  for (const symbol of symbols) {
    await analyzeSymbol(symbol);
  }
}

// Jalankan pertama kali
runAnalysis();

// Lalu jalankan setiap 5 menit
setInterval(runAnalysis, 5 * 60 * 1000); // 5 menit = 300 detik