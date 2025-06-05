// dashboard.js FINAL - Tab Signal & Executed Separated

let exchangeCredentials = JSON.parse(localStorage.getItem('credentials')) || null;
let currentTab = 'executed';

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
  setTradeTableHeader();
  loadTrades();
}

function setTradeTableHeader() {
  const header = document.getElementById('trade-table-header');
  header.innerHTML = currentTab === 'signal-only' ? `
    <th>No</th><th>Pair</th><th>Signal</th><th>Price</th><th>Score</th><th>Time</th>
  ` : `
    <th>No</th><th>Signal</th><th>Status</th><th>Price</th><th>Amount</th><th>Profit</th><th>Time</th>
  `;
}

async function loadBalance() {
  try {
    const res = await fetch('/api/balance');
    const data = await res.json();
    document.getElementById('balance').textContent = data.balance?.toLocaleString('id-ID') + ' IDR';
  } catch {
    document.getElementById('balance').textContent = 'Error';
  }
}

async function loadTrades() {
  try {
    const res = await fetch('/api/trades');
    const data = await res.json();
    const tbody = document.getElementById('trade-table-body');
    tbody.innerHTML = '';
    const filtered = data.filter(t => t.status === currentTab);
    filtered.forEach((trade, i) => {
      const row = document.createElement('tr');
      if (currentTab === 'signal-only') {
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${trade.symbol || '-'}</td>
          <td>${trade.side || '-'}</td>
          <td>${trade.price?.toLocaleString('id-ID') || '-'}</td>
          <td>${(Math.random() * 9 + 1).toFixed(1)}</td>
          <td>${new Date(trade.timestamp).toLocaleString('id-ID')}</td>`;
      } else {
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${trade.signal || '-'}</td>
          <td>${trade.status || '-'}</td>
          <td>${trade.price?.toLocaleString('id-ID') || '-'}</td>
          <td>${trade.amount || '-'}</td>
          <td>${trade.profit || 0}</td>
          <td>${new Date(trade.timestamp).toLocaleString('id-ID')}</td>`;
      }
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load trades:", err);
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('credentials');
  exchangeCredentials = null;
  document.getElementById('connect-status').textContent = '🔄 Not Connected';
  alert('🔓 Logged out.');
});

const form = document.getElementById('credentials-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const exchange = document.getElementById('exchange').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const secretKey = document.getElementById('secretKey').value.trim();
  const tradeAmount = document.getElementById('tradeAmount').value;

  if (!exchange || !apiKey || !secretKey || !tradeAmount) {
    return alert("Please complete all fields.");
  }

  const credentials = { exchange, apiKey, secretKey };
  try {
    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const result = await res.json();
    if (result.success) {
      localStorage.setItem('credentials', JSON.stringify(credentials));
      exchangeCredentials = credentials;
      document.getElementById('connect-status').textContent = '🟢 Connected';
      await loadBalance();
      setTradeTableHeader();
      await loadTrades();
    } else {
      document.getElementById('connect-status').textContent = '🔴 Not Connected';
      alert('❌ Failed to connect: ' + result.error);
    }
  } catch (err) {
    console.error('Connect failed:', err);
    alert('Connection error: ' + err.message);
  }
});

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
        loadBalance();
        setTradeTableHeader();
        loadTrades();
      } else {
        document.getElementById('connect-status').textContent = '🔴 Not Connected';
      }
    });
}
