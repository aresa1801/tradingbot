# run_ai.py
import sys
import json
from ml_strategy import analyze_candles

if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    result = analyze_candles(input_data['candles'])
    print(json.dumps({"signal": result}))