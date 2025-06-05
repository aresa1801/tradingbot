const scalpingStrategy = require('../strategies/scalpingStrategy');
const { shouldOpenPosition } = require('../services/riskManagement');

function runBacktest(candles, initialBalance = 100) {
  let balance = initialBalance;
  let inPosition = false;
  let entryPrice = 0;

  for (let i = 0; i < candles.length; i++) {
    const signal = scalpingStrategy([candles[i]]); // Test per candle

    if (signal === 'BUY' && !inPosition) {
      entryPrice = parseFloat(candles[i][4]);
      const { quantity } = shouldOpenPosition(balance, 5, entryPrice);
      console.log(`[BUY] @ ${entryPrice} USDT | Qty: ${quantity}`);
      inPosition = true;
    }

    if (signal === 'SELL' && inPosition) {
      const exitPrice = parseFloat(candles[i][4]);
      const profit = (exitPrice - entryPrice) * quantity;
      balance += profit;
      console.log(`[SELL] @ ${exitPrice} USDT | Profit: ${profit.toFixed(4)} USDT`);
      inPosition = false;
    }
  }

  console.log(`\nFinal Balance: ${balance.toFixed(4)} USDT`);
  return balance;
}

module.exports = { runBacktest };