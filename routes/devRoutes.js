const express = require('express');
const { callWallet } = require('../services/bitcoinService');

const router = express.Router();

router.post('/pay', async (req, res) => {
  try {
    const { to, amount, wallet = 'w1', fee = 0.0001 } = req.body || {};
    if (!to || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    await callWallet(wallet, 'settxfee', [fee]);
    const txid = await callWallet(wallet, 'sendtoaddress', [to, amount]);
    res.json({ txid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mine', async (req, res) => {
  try {
    const n = Number(req.body?.n || 1);
    const addr = await callWallet('w1', 'getnewaddress', ['miner', 'bech32']);
    const blocks = await callWallet('w1', 'generatetoaddress', [n, addr]);
    res.json({ mined: blocks.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/wallet/:wallet/balance', async (req, res) => {
  try {
    const w = req.params.wallet;
    const b = await callWallet(w, 'getbalances');
    const available = b?.mine?.trusted || 0;
    const pending   = b?.mine?.untrusted_pending || 0;
    const immature  = b?.mine?.immature || 0;
    res.json({ available, pending, immature, total: available + pending + immature });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
