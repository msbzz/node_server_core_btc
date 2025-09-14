const express = require('express');
const { call } = require('../services/bitcoinService');
const { WALLET, USE_USERPASS } = require('../config/core');
const { LND_ON } = require('../services/lnService');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const info = await call('getwalletinfo');
    res.json({
      ok: true,
      wallet: WALLET,
      authMode: USE_USERPASS ? 'userpass' : 'cookie',
      lnd: LND_ON
    });
  } catch {
    res.status(500).json({ ok: false, lnd: LND_ON });
  }
});

module.exports = router;
