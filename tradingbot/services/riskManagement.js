function shouldOpenPosition(balance, riskPercentage, price) {
  const investment = balance * (riskPercentage / 100);
  const quantity = investment / price;
  return { open: true, quantity: quantity.toFixed(4), investment };
}

module.exports = {
  shouldOpenPosition,
};