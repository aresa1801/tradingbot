const axios = require('axios');

const symbols = ['HYPEUSDT', 'PEPEUSDT', 'SOLUSDT', 'SUIUSDT', 'TURBOUSDT'];

async function analyzeAllSymbols() {
  for (const symbol of symbols) {
    try {
      const response = await axios.get(`http://localhost:3000/analyze/${symbol}`);
      console.log(`\n[${symbol}]`);
      console.log(response.data);
    } catch (error) {
      console.error(`Error analyzing ${symbol}: ${error.message}`);
    }
  }
}

analyzeAll();