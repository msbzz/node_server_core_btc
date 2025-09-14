// routes/compatRoutes.js
const express = require('express');
const router = express.Router();

// IMPORTAÇÃO CORRETA (desestruturada)
const {
  makeRpcClient,
  listWallets,
  loadWallet,
  createWallet,
} = require('../config/core');

// ---------- Health ----------
router.get('/health', async (req, res) => {
  try {
    const rpc = makeRpcClient(); // usa ENV.WALLET como padrão
    const info = await rpc.getBlockchainInfo();
    const walletInfo = await rpc.getWalletInfo();
    res.json({
      chain: info.chain,
      blocks: info.blocks,
      wallet: walletInfo.walletname,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'health fail' });
  }
});

// ---------- Carteiras do Core ----------
router.get('/wallets', async (req, res) => {
  try {
    const wallets = await listWallets();
    res.json({ wallets });
  } catch (err) {
    res.status(500).json({ error: err.message || 'listwallets fail' });
  }
});

router.post('/wallets/load', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'param name é obrigatório' });
    await loadWallet(name);
    res.json({ name });
  } catch (err) {
    res.status(500).json({ error: err.message || 'loadwallet fail' });
  }
});

// POST com body { "name": "loja_wallet" }
router.post('/wallets/balance', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'param name é obrigatório' });
    const rpc = makeRpcClient(name);
    const balance = await rpc.getBalance();
    res.json({ name, balance });
  } catch (err) {
    res.status(500).json({ error: err.message || 'getbalance fail' });
  }
});

// (Opcional) GET alternativo: /api/dev/wallet/:name/balance
router.get('/dev/wallet/:name/balance', async (req, res) => {
  try {
    const { name } = req.params;
    const rpc = makeRpcClient(name);
    const balance = await rpc.getBalance();
    res.json({ name, balance });
  } catch (err) {
    res.status(500).json({ error: err.message || 'getbalance fail' });
  }
});

// ---------- Endereços ----------
router.post('/newaddress', async (req, res) => {
  try {
    const { wallet } = req.body || {}; // opcional: enviar qual wallet usar
    const rpc = makeRpcClient(wallet);
    const address = await rpc.getNewAddress('', 'bech32');
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message || 'newaddress fail' });
  }
});

// ---------- Pagamentos on-chain (dev) ----------
router.post('/dev/pay', async (req, res) => {
  try {
    const { to, amount, wallet, fee } = req.body || {};
    if (!to || typeof amount !== 'number')
      return res.status(400).json({ error: 'to e amount (BTC) são obrigatórios' });

    const rpc = makeRpcClient(wallet);

    // Se quiser forçar fee rate por vB, aqui teria que usar settxfee/estimatesmartfee ou sendtoaddress com options,
    // mas para simples teste vamos chamar direto:
    const txid = await rpc.sendToAddress(to, amount, '', '');

    res.json({ txid });
  } catch (err) {
    res.status(500).json({ error: err.message || 'sendtoaddress fail' });
  }
});

// ---------- LN (apenas esqueleto; ajusta conforme seu serviço que fala com LND) ----------
// Exemplo: criar fatura Lightning esperando body { amount (sats), memo }
router.post('/ln/invoice', async (req, res) => {
  try {
    const { amount, memo } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'amount (sats) é obrigatório' });

    // aqui entraria a chamada ao seu serviço LND (não faz parte do core RPC)
    // placeholder:
    return res.status(501).json({ error: 'LN não implementado neste serviço' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'ln invoice fail' });
  }
});

module.exports = router;
