# ml_strategy.py
import sys
import json

def analyze_candles(candles):
    # Dummy logic: jika harga naik > 1%, prediksi BUY
    closes = [float(candle[4]) for candle in candles]
    last_price = closes[-1]
    avg_price = sum(closes) / len(closes)

    if last_price > avg_price * 1.01:
        return "BUY"
    elif last_price < avg_price * 0.99:
        return "SELL"
    else:
        return "HOLD"

if __name__ == "__main__":
    # Baca input JSON dari Node.js
    input_data = json.loads(sys.stdin.read())
    candles = input_data['candles']
    result = analyze_candles(candles)
    print(json.dumps({"signal": result}))