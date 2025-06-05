// dashboard.js FINAL INDODAX IDR READY + LOCALSTORAGE RECONNECT

let exchangeCredentials = JSON.parse(localStorage.getItem('credentials')) || null;

const langMap = {
  en: {
    connect: "Connect",
    exchange_info: "Exchange Info",
    select_exchange: "Select Exchange:",
    api_key: "API Key:",
    secret_key: "Secret Key:",
    usdt_trade: "IDR per Trade:",
    order_manual: "Manual Order",
    symbol: "Symbol:",
    side: "Side:",
    amount: "Amount:",
    execute: "Execute Order",
    bot_control: "Bot Control",
    start_bot: "Start Bot",
    stop_bot: "Stop Bot",
    status: "Status:",
    dashboard: "Trading Dashboard",
    balance: "Balance",
    weekly: "Weekly Profit",
    monthly: "Monthly Profit",
    winrate: "Winrate",
    history: "Transaction History",
    ip_label: "Current IP",
    loading: "Loading...",
    table: ["No", "Signal", "Status", "Price", "Amount", "Profit", "Time"]
  },
  id: {
    connect: "Hubungkan",
    exchange_info: "Informasi Exchange",
    select_exchange: "Pilih Exchange:",
    api_key: "API Key:",
    secret_key: "Secret Key:",
    usdt_trade: "Jumlah IDR per Transaksi:",
    order_manual: "Order Manual",
    symbol: "Simbol:",
    side: "Arah:",
    amount: "Jumlah:",
    execute: "Kirim Order",
    bot_control: "Kontrol Bot",
    start_bot: "Mulai Bot",
    stop_bot: "Hentikan Bot",
    status: "Status:",
    dashboard: "Dashboard Trading",
    balance: "Saldo",
    weekly: "Profit Mingguan",
    monthly: "Profit Bulanan",
    winrate: "Winrate",
    history: "Riwayat Transaksi",
    ip_label: "IP Saat Ini",
    loading: "Memuat...",
    table: ["No", "Sinyal", "Status", "Harga", "Jumlah", "Laba", "Waktu"]
  }
};

function setLanguage(lang = 'en') {
  const t = langMap[lang];
  document.getElementById('connectBtn').textContent = t.connect;
  document.getElementById('label-exchange').textContent = `🔐 ${t.exchange_info}`;
  document.getElementById('label-select').textContent = t.select_exchange;
  document.getElementById('label-api').textContent = t.api_key;
  document.getElementById('label-secret').textContent = t.secret_key;
  document.getElementById('label-trade').textContent = t.usdt_trade;
  document.querySelector('h3[lang="order"]').textContent = `🛒 ${t.order_manual}`;
  document.getElementById('label-symbol').textContent = t.symbol;
  document.getElementById('label-side').textContent = t.side;
  document.getElementById('label-amount').textContent = t.amount;
  document.getElementById('sendOrderBtn').textContent = t.execute;
  document.querySelector('h3[lang="bot"]').textContent = `🤖 ${t.bot_control}`;
  document.getElementById('startBotBtn').textContent = `▶️ ${t.start_bot}`;
  document.getElementById('stopBotBtn').textContent = `⏹ ${t.stop_bot}`;
  document.getElementById('status-label').textContent = t.status;
  document.getElementById('label-title').textContent = `📈 ${t.dashboard}`;
  document.getElementById('label-balance').textContent = t.balance;
  document.getElementById('label-daily').textContent = t.weekly;
  document.getElementById('label-weekly').textContent = t.monthly;
  document.getElementById('label-winrate').textContent = t.winrate;
  document.getElementById('label-history').textContent = `📋 ${t.history}`;
  const headers = ['th-no', 'th-signal', 'th-status', 'th-price', 'th-amount', 'th-profit', 'th-time'];
  headers.forEach((id, i) => document.getElementById(id).textContent = t.table[i]);
  document.getElementById('label-ip').textContent = `🌐 ${t.ip_label}`;
  document.getElementById('current-ip').textContent = t.loading;
}

document.getElementById('lang-toggle').addEventListener('change', (e) => {
  setLanguage(e.target.value);
});

setLanguage('en');

async function getCurrentIP() {
  try {
    const res = await fetch('/api/ip');
    const data = await res.json();
    document.getElementById('current-ip').textContent = data.ip || '-';
  } catch (err) {
    document.getElementById('current-ip').textContent = 'Unavailable';
  }
}
getCurrentIP();

async function updateBotStatus() {
  try {
    const res = await fetch('/api/bot/status');
    const data = await res.json();
    const statusText = data.running ? '🟢 Running' : '🔴 Stopped';
    document.getElementById('botStatus').textContent = statusText;
  } catch (err) {
    document.getElementById('botStatus').textContent = '🚫 Error';
  }
}

const form = document.getElementById('credentials-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const exchange = document.getElementById('exchange').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const secretKey = document.getElementById('secretKey').value.trim();
  const tradeAmount = document.getElementById('tradeAmount').value;

  if (!exchange || !apiKey || !secretKey || !tradeAmount) {
    alert("Please fill in all required fields.");
    return;
  }

  const credentials = { exchange, apiKey, secretKey };
  try {
    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    const result = await res.json();
    if (result.success) {
      localStorage.setItem('credentials', JSON.stringify(credentials));
      document.getElementById('connect-status').textContent = '🟢 Connected';
      exchangeCredentials = credentials;
      await updateBotStatus();
    } else {
      document.getElementById('connect-status').textContent = '🔴 Not Connected';
      alert('❌ Gagal menghubungkan ke exchange: ' + result.error);
    }
  } catch (err) {
    console.error('❌ FETCH failed:', err.message);
    document.getElementById('connect-status').textContent = '🔴 Not Connected';
    alert('❌ Gagal koneksi: ' + err.message);
  }
});

// 🔁 Auto-reconnect on page load if credentials in localStorage
if (exchangeCredentials) {
  fetch('/api/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exchangeCredentials)
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        document.getElementById('connect-status').textContent = '🟢 Connected';
        updateBotStatus();
      } else {
        document.getElementById('connect-status').textContent = '🔴 Not Connected';
      }
    })
    .catch(() => {
      document.getElementById('connect-status').textContent = '🔴 Not Connected';
    });
}
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('credentials');
  exchangeCredentials = null;
  document.getElementById('connect-status').textContent = '🔄 Not Connected';
  alert('🔓 Disconnected and cleared local credentials.');
});
