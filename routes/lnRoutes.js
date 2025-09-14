// routes/lnRoutes.js
const express = require('express');
const svc = require('../services/lndService');

console.log('[BOOT] lndService exports:', Object.keys(svc));

const {
  makeLndClient,
  getInfo,
  walletBalance,
  channelBalance,
  newAddress,
  createInvoice,
  getInvoiceByRHashBase64,
} = svc;

if (typeof makeLndClient !== 'function') {
  throw new Error('makeLndClient não exportado corretamente de services/lndService.js');
}

const router = express.Router();

// ping do próprio router (para provar que ELE está montado)
router.get('/__ping', (_req, res) => {
  res.json({ ok: true, where: 'router' });
});

// health usando getInfo
router.get('/health', async (_req, res) => {
  try {
    const lnd = makeLndClient();
    const info = await getInfo(lnd);
    console.log('[API] GET /api/ln/health -> ok', { version: info.version, pubkey: info.identity_pubkey });
    res.json({ ok: true, version: info.version, pubkey: info.identity_pubkey });
  } catch (e) {
    console.error('[API] GET /api/ln/health -> erro', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// criar fatura
router.post('/invoice', async (req, res) => {
  const { amountSats, memo } = req.body || {};
  console.log('[API] POST /api/ln/invoice', { amountSats, memo });
  if (!amountSats || Number(amountSats) <= 0) {
    return res.status(400).json({ error: 'amountSats must be > 0' });
  }
  try {
    const lnd = makeLndClient();
    const inv = await createInvoice(lnd, Number(amountSats), memo || '');
    const r_hash_hex = inv?.r_hash ? Buffer.from(inv.r_hash, 'base64').toString('hex') : undefined;
    res.json({
      payment_request: inv.payment_request,
      r_hash: inv.r_hash,
      r_hash_hex,
      add_index: inv.add_index,
    });
  } catch (e) {
    console.error('[API] POST /api/ln/invoice -> erro', e?.response?.data || e?.message || e);
    res.status(e?.response?.status || 400).json({ error: e?.response?.data || e?.message || String(e) });
  }
});

// status por hash (aceita base64/hex)
router.get('/invoice/:rhash', async (req, res) => {
  const rhash = req.params.rhash;
  console.log('[API] GET /api/ln/invoice/:rhash', { rhash });
  try {
    const lnd = makeLndClient();
    const data = await getInvoiceByRHashBase64(lnd, rhash);
    const settled = !!(data.settled || data.state === 'SETTLED' || data.result === 'paid');
    res.json({ ...data, settled, status: settled ? 'paid' : 'pending' });
  } catch (e) {
    console.error('[API] GET /api/ln/invoice/:rhash -> erro', e?.response?.data || e?.message || e);
    res.status(e?.response?.status || 404).json({ error: e?.response?.data || e?.message || String(e) });
  }
});

// novo endereço
router.post('/newaddress', async (req, res) => {
  const type = req.body?.type || 'p2wkh';
  console.log('[API] POST /api/ln/newaddress', { type });
  try {
    const lnd = makeLndClient();
    const r = await newAddress(lnd, type);
    res.json(r);
  } catch (e) {
    console.error('[API] POST /api/ln/newaddress -> erro', e?.response?.data || e?.message || e);
    res.status(e?.response?.status || 400).json({ error: e?.response?.data || e?.message || String(e) });
  }
});

// saldos
router.get('/wallet/balance', async (_req, res) => {
  try {
    const lnd = makeLndClient();
    const r = await walletBalance(lnd);
    res.json(r);
  } catch (e) {
    console.error('[API] GET /api/ln/wallet/balance -> erro', e?.message || e);
    res.status(500).json({ error: e?.message || String(e) });
  }
});

router.get('/channel/balance', async (_req, res) => {
  try {
    const lnd = makeLndClient();
    const r = await channelBalance(lnd);
    res.json(r);
  } catch (e) {
    console.error('[API] GET /api/ln/channel/balance -> erro', e?.message || e);
    res.status(500).json({ error: e?.message || String(e) });
  }
});

console.log('[BOOT] lnRoutes pronto: /__ping, /health, /invoice, /invoice/:rhash, /newaddress, /wallet/balance, /channel/balance');
module.exports = router;
