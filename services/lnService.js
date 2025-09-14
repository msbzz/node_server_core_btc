// routes/lnRoutes.js
const express = require('express');
const router = express.Router();
const lnd = require('../services/lndService');

// health simples
router.get('/ln/health', async (req, res) => {
  try {
    // ping rápido (wallet balance) só p/ checar headers/conn
    await lnd.walletBalance();
    console.log('[API] GET /api/ln/health -> ok');
    res.json({ ok: true });
  } catch (e) {
    console.error('[API] GET /api/ln/health -> erro', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// criar fatura
router.post('/ln/invoice', async (req, res) => {
  const { amountSats, memo } = req.body || {};
  console.log('[API] POST /api/ln/invoice', { amountSats, memo });

  if (!amountSats || Number(amountSats) <= 0) {
    return res.status(400).json({ error: 'amountSats must be > 0' });
  }
  try {
    const inv = await lnd.createInvoiceSats(Number(amountSats), memo || '');
    // devolve pr + hash (como vier)
    res.json({
      payment_request: inv.payment_request,
      r_hash: inv.r_hash,               // base64 vindo da LND
      payment_hash: inv.r_hash ? undefined : inv.payment_hash, // se sua versão devolver payment_hash
      add_index: inv.add_index,
    });
  } catch (e) {
    console.error('[API] POST /api/ln/invoice -> erro', e?.response?.data || e?.message || e);
    res.status(e?.response?.status || 400).json({ error: e?.response?.data || e?.message || String(e) });
  }
});

// status da fatura (aceita HEX ou BASE64)
router.get('/ln/invoice/:id', async (req, res) => {
  const id = req.params.id;
  console.log('[API] GET /api/ln/invoice/:id', { id });
  try {
    const data = await lnd.lookupInvoice(id);
    // normaliza flag de "paid"
    const paid = !!(data.settled || data.state === 'SETTLED' || data.result === 'paid');
    res.json({ ...data, settled: paid, status: paid ? 'paid' : 'pending' });
  } catch (e) {
    console.error('[API] GET /api/ln/invoice/:id -> erro', e?.response?.data || e?.message || e);
    res.status(e?.response?.status || 404).json({ error: e?.response?.data || e?.message || String(e) });
  }
});

// endereço on-chain
router.post('/ln/newaddress', async (req, res) => {
  const { type } = req.body || {};
  console.log('[API] POST /api/ln/newaddress', { type });
  try {
    const r = await lnd.newAddress(type || 'p2wkh');
    res.json(r); // { address }
  } catch (e) {
    console.error('[API] POST /api/ln/newaddress -> erro', e?.response?.data || e?.message || e);
    res.status(e?.response?.status || 400).json({ error: e?.response?.data || e?.message || String(e) });
  }
});

// saldos
router.get('/ln/wallet/balance', async (_req, res) => {
  try {
    const r = await lnd.walletBalance();
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

router.get('/ln/channel/balance', async (_req, res) => {
  try {
    const r = await lnd.channelBalance();
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

module.exports = router;
