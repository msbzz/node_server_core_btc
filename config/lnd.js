// config/lnd.js
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const ENV = require('./index');

function macaroonHex(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.toString('hex');
}

const httpsAgent = new https.Agent({
  ca: fs.readFileSync(ENV.LND_TLS_CERT_PATH), // verifica contra o cert da LND
});

const lnd = axios.create({
  baseURL: ENV.LND_REST_URL.replace(/\/+$/, ''),
  timeout: 20000,
  httpsAgent,
  headers: {
    'Grpc-Metadata-macaroon': macaroonHex(ENV.LND_MACAROON_PATH),
  },
});

// Wrappers usados nas rotas/serviços
async function getInfo() {
  const { data } = await lnd.get('/v1/getinfo');
  return data;
}

async function addInvoice(amountSats, memo = 'pedido-testnet') {
  const body = { value: String(amountSats), memo, expiry: 300 };
  const { data } = await lnd.post('/v1/invoices', body);
  return data; // { payment_request, r_hash, add_index, ... }
}

async function lookupInvoiceByRHashHex(rhashHex) {
  const { data } = await lnd.get(`/v1/invoice/${rhashHex}`);
  return data;
}

module.exports = { getInfo, addInvoice, lookupInvoiceByRHashHex };
