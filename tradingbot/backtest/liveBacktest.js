async function liveBacktest(symbol = 'SOLUSDT') {
  const candles = [
    [1717029600000, "132.5", "132.8", "132.3", "132.6", "12345"],
    [1717029660000, "132.6", "133.0", "132.5", "132.9", "14500"],
    [1717029720000, "132.9", "133.1", "132.7", "132.8", "13200"]
  ];

  console.log(`\nRunning backtest for ${symbol} with ${candles.length} candles`);
  await runBacktest(candles, 100);
}

liveBacktest();