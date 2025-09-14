// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();

const btc = require('../services/bitcoinService');
const Lnd = require('../config/lnd');

// ---------------- CORE (Bitcoin testnet) ----------------

// Health (cadeia + wallet atual)
router.get('/health', async (_req, res) => {
  try { res.json(await btc.health()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// LISTA CARTEIRAS (Insomnia: GET /api/wallets)
router.get('/wallets', async (_req, res) => {
  try { res.json(await btc.listWallets()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// LOAD WALLET (Insomnia: POST /api/wallets/load { "name": "loja_wallet" })
router.post('/wallets/load', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name é obrigatório' });
    res.json(await btc.loadWallet(name));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SALDO DA WALLET DEFAULT (GET /api/balance)
router.get('/balance', async (_req, res) => {
  try { res.json(await btc.balance()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// SALDO DE UMA WALLET ESPECÍFICA (GET /api/wallets/balance?name=loja_wallet)
router.get('/wallets/balance', async (req, res) => {
  try {
    const { name } = req.query || {};
    if (!name) return res.status(400).json({ error: 'param name é obrigatório' });
    res.json(await btc.balanceOf(name));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ENDEREÇO NOVO (Insomnia: POST /api/newaddress)
router.post('/newaddress', async (_req, res) => {
  try { res.json(await btc.newAddress()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ENVIO ON-CHAIN (POST /api/sendtoaddress { address, amount })
router.post('/sendtoaddress', async (req, res) => {
  try {
    const { address, amount } = req.body || {};
    if (!address || amount == null) {
      return res.status(400).json({ error: 'address e amount são obrigatórios' });
    }
    res.json(await btc.sendToAddress(address, amount));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LISTA TXs
router.get('/txs', async (_req, res) => {
  try { res.json(await btc.listTransactions(20)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------- Lightning (Loja – testnet) ----------------

router.get('/ln/info', async (_req, res) => {
  try { res.json(await Lnd.getInfo()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// cria invoice (sats)
router.post('/ln/invoice', async (req, res) => {
  try {
    const { amount, memo } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'amount (sats) é obrigatório' });
    const inv = await Lnd.addInvoice(Number(amount), memo || 'pedido');
    res.json({
      bolt11: inv.payment_request,
      r_hash: Buffer.from(inv.r_hash, 'base64').toString('hex'),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// checa invoice por r_hash (hex)
router.get('/ln/invoice/:rhash', async (req, res) => {
  try { res.json(await Lnd.lookupInvoiceByRHashHex(req.params.rhash)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router; // <<< EXPORTA O ROUTER (função)
