const { exec } = require('child_process');
const path = require('path');

function runAIStrategy(candles, callback) {
  const scriptPath = path.join(__dirname, '../models/ai/run_ai.py');
  const input = JSON.stringify({ candles });

  const pythonProcess = exec(`python3 ${scriptPath}`);

  pythonProcess.stdin.write(input);
  pythonProcess.stdin.end();

  let output = '';
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return callback(new Error('Python script failed'));
    }
    try {
      const result = JSON.parse(output);
      callback(null, result.signal);
    } catch (e) {
      callback(e);
    }
  });
}

module.exports = runAIStrategy;