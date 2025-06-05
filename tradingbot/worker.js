                                               // worker.js

                                               const axios = require('axios');
                                               const fs = require('fs');
                                               const path = require('path');

                                               // Konfigurasi interval dan simbol
                                               const INTERVAL_MS = 300000; // 5 menit
                                               const SYMBOL = 'SOLUSDT';
                                               const API_URL = 'http://localhost:3000/analyze';

                                               // Simpan log ke file lokal (opsional)
                                               const LOG_FILE = path.join(__dirname, 'logs', 'trading-worker.log');

                                               if (!fs.existsSync(path.join(__dirname, 'logs'))) {
                                                 fs.mkdirSync(path.join(__dirname, 'logs'));
                                               }

                                               function logToFile(message) {
                                                 const timestamp = new Date().toISOString();
                                                 fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
                                               }

                                               async function runAnalysis() {
                                                 try {
                                                   console.log(`Fetching signal for ${SYMBOL}...`);
                                                   const response = await axios.get(`${API_URL}/${SYMBOL}`);
                                                   const result = response.data;

                                                   console.log(`Signal received: ${result.scalping_signal} | Harga: ${result.last_price}`);

                                                   // Simpan ke log file
                                                   logToFile(`
                                               ✅ Signal diterima:
                                                  Simbol     : ${result.symbol}
                                                  Sinyal     : ${result.scalping_signal}
                                                  Harga      : ${result.last_price}
                                                  Jumlah USDT: ${result.investment}
                                               `);

                                                   // Tampilkan notifikasi desktop (kalau di local)
                                                   if (process.stdout.isTTY) {
                                                     console.log('\x07'); // Beep notification (jika support)
                                                   }

                                                 } catch (error) {
                                                   const errorMsg = `❌ Error fetching signal: ${error.message}`;
                                                   console.error(errorMsg);
                                                   logToFile(errorMsg);
                                                 }
                                               }

                                               // Jalankan pertama kali saat worker start
                                               runAnalysis();

                                               // Lalu jalankan setiap interval
                                               setInterval(runAnalysis, INTERVAL_MS);

                                               console.log(`🤖 Worker started. Running every ${INTERVAL_MS / 60000} minutes.`);