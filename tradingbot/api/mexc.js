const express = require('express');
const axios = require('axios');
const router = express.Router();

// MexC API Base URL
const MEXC_API_URL = 'https://api.mexc.com/api/v3'; 

router.get('/kline', async (req, res) => {
  const { symbol, interval } = req.query;

  try {
    // Validasi input
    if (!symbol || !interval) {
      return res.status(400).json({ success: false, error: 'Missing symbol or interval' });
    }

    console.log(`Fetching from MEXC: ${MEXC_API_URL}/klines?symbol=${symbol}&interval=${interval}`);

    const response = await axios.get(`${MEXC_API_URL}/klines`, {
      params: {
        symbol,
        interval,
        limit: 200
      }
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error(`Error fetching from MEXC:`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Data:`, error.response?.data);
    console.error(`Message: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch candlestick data' });
  }
});

module.exports = router;