const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../logs/app.log');

// Bersihkan log setiap kali restart
if (fs.existsSync(logFilePath)) {
  fs.unlinkSync(logFilePath);
}

const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function log(level, message) {
  const time = new Date().toISOString();
  const entry = `[${time}] [${level.toUpperCase()}] ${message}\n`;
  process.stdout.write(entry);
  logStream.write(entry);
}

module.exports = {
  info: (msg) => log('info', msg),
  error: (msg) => log('error', msg),
  warn: (msg) => log('warn', msg),
};