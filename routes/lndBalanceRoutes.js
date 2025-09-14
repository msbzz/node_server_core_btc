// routes/lndBalanceRoutes.js
const express = require('express');
const router = express.Router();
const lnd = require('../services/lndService');

router.get('/lnd/walletbalance', async (req, res) => {
  try {
    const data = await lnd.getWalletBalance();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'lnd walletbalance failed' });
  }
});

router.get('/lnd/channelbalance', async (req, res) => {
  try {
    const data = await lnd.getChannelBalance();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'lnd channelbalance failed' });
  }
});

router.get('/lnd/balance', async (req, res) => {
  try {
    const data = await lnd.getCombinedBalance();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'lnd combined balance failed' });
  }
});

module.exports = router;
