// routes/lndRoutes.js
const express = require('express');
const router = express.Router();
const LND = require('../services/lndService');

// Health simples da LND
router.get('/health', async (req, res) => {
  try {
    const info = await LND.getInfo();
    res.json({ lnd: 'ok', pubkey: info.identity_pubkey, version: info.version, chains: info.chains });
  } catch (e) {
    res.status(500).json({ error: e.message || 'LND offline' });
  }
});

// Saldo on-chain da carteira da LND
router.get('/wallet/balance', async (req, res) => {
  try {
    const data = await LND.walletBalance();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'wallet balance error' });
  }
});

// Saldo em canais LN
router.get('/channel/balance', async (req, res) => {
  try {
    const data = await LND.channelBalance();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'channel balance error' });
  }
});

// Novo endereço ON-CHAIN (da carteira da LND)
router.post('/newaddress', async (req, res) => {
  try {
    const type = (req.body && req.body.type) || 'p2wkh';
    const data = await LND.newAddress(type);
    res.json(data); // { address }
  } catch (e) {
    res.status(500).json({ error: e.message || 'newaddress error' });
  }
});

// Criar fatura Lightning
router.post('/invoice', async (req, res) => {
  try {
    const { amount, amount_msat, memo } = req.body || {};
    const inv = await LND.addInvoice({ amount, amount_msat, memo });
    res.json(inv);
  } catch (e) {
    const msg = e.message || 'invoice error';
    const code = /obrigatório/.test(msg) ? 400 : 500;
    res.status(code).json({ error: msg });
  }
});

// Pagar fatura Lightning (BOLT11)
router.post('/pay', async (req, res) => {
  try {
    const { payreq, payment_request, timeout_seconds } = req.body || {};
    const result = await LND.payInvoice({ payreq, payment_request, timeout_seconds });
    res.json(result);
  } catch (e) {
    const msg = e.message || 'pay error';
    const code = /obrigatório/.test(msg) ? 400 : 500;
    res.status(code).json({ error: msg });
  }
});

module.exports = router;
