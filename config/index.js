// config/index.js
const path = require('path');

const ENV = {
  // -------- BITCOIN CORE (TESTNET) --------
  BITCOIN_RPC_URL: process.env.BITCOIN_RPC_URL || 'http://127.0.0.1:18332',
  BITCOIN_COOKIE_PATH:
    process.env.BITCOIN_COOKIE_PATH ||
    (process.env.APPDATA
      ? path.join(process.env.APPDATA, 'Bitcoin', 'testnet3', '.cookie')
      : ''),

  BITCOIN_RPC_USER: process.env.BITCOIN_RPC_USER || null,
  BITCOIN_RPC_PASS: process.env.BITCOIN_RPC_PASS || null,
  WALLET: process.env.WALLET || 'wtest',

  // -------- LND LOJA (TESTNET) ------------
  LND_REST_URL: process.env.LND_REST_URL || 'https://127.0.0.1:8082',
  LND_TLS_CERT_PATH: process.env.LND_TLS_CERT_PATH || 'C:\\lndA\\tls.cert',
  LND_MACAROON_PATH:
    process.env.LND_MACAROON_PATH ||
    'C:\\lndA\\data\\chain\\bitcoin\\testnet\\admin.macaroon',

  DEV: process.env.DEV === '1',
};

module.exports = ENV;
