// config/core.js
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const ENV = require('./index');

// ---------- AUTH DO CORE (cookie testnet ou user/pass) ----------
function getCoreAuth() {
  if (ENV.BITCOIN_RPC_USER && ENV.BITCOIN_RPC_PASS) {
    return { username: ENV.BITCOIN_RPC_USER, password: ENV.BITCOIN_RPC_PASS };
  }
  const cookiePath =
    ENV.BITCOIN_COOKIE_PATH ||
    (process.env.APPDATA
      ? path.join(process.env.APPDATA, 'Bitcoin', 'testnet3', '.cookie')
      : '');
  if (!cookiePath) {
    throw new Error(
      'Defina BITCOIN_COOKIE_PATH (ex.: C:\\Users\\<user>\\AppData\\Roaming\\Bitcoin\\testnet3\\.cookie)',
    );
  }
  const raw = fs.readFileSync(cookiePath, 'utf8').trim(); // "user:pass"
  const [username, password] = raw.split(':');
  return { username, password };
}

// ---------- CLIENTES RPC ----------
const AUTH = getCoreAuth();
const RPC_BASE = (ENV.BITCOIN_RPC_URL || 'http://127.0.0.1:18332').replace(/\/+$/, '');

const baseClient = axios.create({
  baseURL: RPC_BASE,            // sem /wallet
  timeout: 20000,
  auth: AUTH,
});

function walletClient(walletName) {
  const url = `${RPC_BASE}/wallet/${encodeURIComponent(walletName)}`;
  return axios.create({
    baseURL: url,               // com /wallet/<name>
    timeout: 20000,
    auth: AUTH,
  });
}

// ---------- CHAMADAS RPC ----------
async function rpcCall(client, method, params = []) {
  const { data } = await client.post('', {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  });
  if (data.error) {
    // inclui code/mensagens do Core
    const err = new Error(data.error.message || 'RPC error');
    err.code = data.error.code;
    err.data = data.error.data;
    throw err;
  }
  return data.result;
}

// ---------- UTIL: garantir carteira carregada ----------
async function ensureWalletLoaded(walletName) {
  try {
    // listwallets verifica se já está carregada
    const wallets = await rpcCall(baseClient, 'listwallets');
    if (Array.isArray(wallets) && wallets.includes(walletName)) return true;

    // tenta carregar
    await rpcCall(baseClient, 'loadwallet', [walletName]);
    return true;
  } catch (e) {
    // se não existir, o Core pode retornar erro. Propaga para o caller decidir criar.
    throw e;
  }
}

// ---------- CLIENTE COMPATÍVEL COM SEU SERVICE ----------
function makeRpcClient(walletNameArg) {
  const walletName = walletNameArg || ENV.WALLET || 'wtest';
  const client = walletClient(walletName);

  // wrapper com retry: se a wallet não existir/estiver descarregada, carrega e repete a chamada
  async function call(method, params = []) {
    try {
      return await rpcCall(client, method, params);
    } catch (e) {
      const msg = (e.message || '').toLowerCase();
      if (e.code === -18 || msg.includes('requested wallet does not exist') || msg.includes('not loaded')) {
        await ensureWalletLoaded(walletName);
        return await rpcCall(client, method, params);
      }
      throw e;
    }
  }

  return {
    call,
    // Métodos usados nos testes originais
    getBlockchainInfo: () => call('getblockchaininfo'),
    getNetworkInfo:    () => call('getnetworkinfo'),
    getWalletInfo:     () => call('getwalletinfo'),
    getBalance:        () => call('getbalance'),
    getNewAddress:     (label = '', type = 'bech32') => call('getnewaddress', [label, type]),
    listTransactions:  (count = 10, skip = 0, includeWatchOnly = false) =>
                          call('listtransactions', ['*', count, skip, includeWatchOnly]),
    sendToAddress:     (address, amountBtc, comment = '', commentTo = '') =>
                          call('sendtoaddress', [address, amountBtc, comment, commentTo]),
  };
}

// ---------- Funções base (sem /wallet) para endpoints utilitários ----------
async function listWallets() {
  return rpcCall(baseClient, 'listwallets');
}
async function loadWallet(name) {
  return rpcCall(baseClient, 'loadwallet', [name]);
}
async function createWallet(name) {
  // usa default descriptors = true nas versões recentes
  return rpcCall(baseClient, 'createwallet', [name]);
}

module.exports = {
  makeRpcClient,
  listWallets,
  loadWallet,
  createWallet,
};
