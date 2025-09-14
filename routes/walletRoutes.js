const express = require('express');
const { call } = require('../services/bitcoinService');

const router = express.Router();

router.get('/balance', async (_req, res) => {
  try {
    const b = await call('getbalances');
    const available = b?.mine?.trusted || 0;
    const pending   = b?.mine?.untrusted_pending || 0;
    const immature  = b?.mine?.immature || 0;
    res.json({ available, pending, immature, total: available + pending + immature });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/refund', async (req, res) => {
  try {
    const { to, amount, subtractFeeFromAmount = true, fee = 0.0001 } = req.body || {};
    if (!to || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    const v = await call('validateaddress', [to]);
    if (!v?.isvalid) return res.status(400).json({ error: 'Endereço inválido' });

    await call('settxfee', [fee]);
    const txid = await call('sendtoaddress', [to, amount, '', '', subtractFeeFromAmount]);
    res.json({ txid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
