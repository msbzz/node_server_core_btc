// services/lndService.js
const fs = require('fs');
const https = require('https');
const axios = require('axios');
const ENV = require('../config');

// ---------- helpers ----------
function hexMacaroon(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.toString('hex');
}
const isHex = (s) => typeof s === 'string' && /^[0-9a-fA-F]+$/.test(s);
const b64ToHex = (b64) => Buffer.from(b64, 'base64').toString('hex');

function logReq(name, { method, url, data }) {
  try { console.log(`[LND->${name}] ${method} ${url}`, data ? { data } : ''); } catch {}
}
function logRes(name, { status, ms, data }) {
  try { console.log(`[LND<-${name}] status=${status} (${ms}ms)`, data); } catch {}
}
function logErr(name, err, ms) {
  const status = err?.response?.status;
  const body = err?.response?.data || err?.message || err;
  console.error(`[LND x ${name}] (${ms}ms)`, status, body);
}

function makeLndClient({
  baseURL = ENV.LND_REST_URL,
  tlsPath = ENV.LND_TLS_CERT_PATH,
  macaroonPath = ENV.LND_MACAROON_PATH,
} = {}) {
  if (!baseURL) throw new Error('LND_REST_URL não definido no .env');
  if (!tlsPath) throw new Error('LND_TLS_CERT_PATH não definido no .env');
  if (!macaroonPath) throw new Error('LND_MACAROON_PATH não definido no .env');

  const httpsAgent = new https.Agent({ ca: fs.readFileSync(tlsPath) });
  const macaroonHex = hexMacaroon(macaroonPath);

  const client = axios.create({
    baseURL,
    timeout: 15000,
    httpsAgent,
    headers: { 'Grpc-Metadata-macaroon': macaroonHex },
  });

  client.interceptors.request.use((cfg) => {
    console.log('[LND axios] ->', cfg.method?.toUpperCase(), cfg.url);
    return cfg;
  });
  client.interceptors.response.use(
    (res) => {
      console.log('[LND axios] <-', res.status, res.config?.url);
      return res;
    },
    (err) => {
      console.error('[LND axios] x', err?.response?.status, err?.config?.url, err?.response?.data || err?.message);
      return Promise.reject(err);
    }
  );

  return client;
}

// --------- wrappers REST LND ---------
async function getInfo(client) {
  const url = '/v1/getinfo';
  const t0 = Date.now();
  logReq('getInfo', { method: 'GET', url });
  try {
    const r = await client.get(url);
    logRes('getInfo', { status: r.status, ms: Date.now() - t0, data: r.data });
    return r.data;
  } catch (e) {
    logErr('getInfo', e, Date.now() - t0);
    throw e;
  }
}

async function walletBalance(client) {
  const url = '/v1/balance/blockchain';
  const t0 = Date.now();
  logReq('walletBalance', { method: 'GET', url });
  try {
    const r = await client.get(url);
    logRes('walletBalance', { status: r.status, ms: Date.now() - t0, data: r.data });
    const { confirmed_balance, unconfirmed_balance, total_balance } = r.data || {};
    return {
      confirmed: Number(confirmed_balance || 0),
      unconfirmed: Number(unconfirmed_balance || 0),
      total: Number(total_balance || 0),
    };
  } catch (e) {
    logErr('walletBalance', e, Date.now() - t0);
    throw e;
  }
}

async function channelBalance(client) {
  const url = '/v1/balance/channels';
  const t0 = Date.now();
  logReq('channelBalance', { method: 'GET', url });
  try {
    const r = await client.get(url);
    logRes('channelBalance', { status: r.status, ms: Date.now() - t0, data: r.data });
    const { local_balance, remote_balance, pending_open_balance } = r.data || {};
    return {
      local: Number(local_balance?.sat || local_balance || 0),
      remote: Number(remote_balance?.sat || remote_balance || 0),
      pending: Number(pending_open_balance?.sat || pending_open_balance || 0),
    };
  } catch (e) {
    logErr('channelBalance', e, Date.now() - t0);
    throw e;
  }
}

async function newAddress(client, type = 'p2wkh') {
  const url = '/v1/newaddress';
  const t0 = Date.now();
  const body = { type };
  logReq('newAddress', { method: 'POST', url, data: body });
  try {
    const r = await client.post(url, body);
    logRes('newAddress', { status: r.status, ms: Date.now() - t0, data: r.data });
    return r.data; // { address }
  } catch (e) {
    logErr('newAddress', e, Date.now() - t0);
    throw e;
  }
}

async function createInvoice(client, amountSats, memo = '') {
  const url = '/v1/invoices';
  const t0 = Date.now();
  const body = { value: String(amountSats), memo, expiry: 300 }; // 'value' em sats
  logReq('createInvoice', { method: 'POST', url, data: body });
  try {
    const r = await client.post(url, body);
    logRes('createInvoice', { status: r.status, ms: Date.now() - t0, data: r.data });
    return r.data; // { payment_request, r_hash (base64), ... }
  } catch (e) {
    logErr('createInvoice', e, Date.now() - t0);
    throw e;
  }
}

/** Aceita base64 ou hex; consulta sempre com HEX em /v1/invoice/<hex> */
async function getInvoiceByRHashBase64(client, rHashMaybeB64) {
  let hex = rHashMaybeB64;
  if (!isHex(hex)) {
    try { hex = b64ToHex(rHashMaybeB64); } catch {}
  }
  const url = `/v1/invoice/${hex}`;
  const t0 = Date.now();
  logReq('getInvoiceByRHash', { method: 'GET', url });
  try {
    const r = await client.get(url);
    logRes('getInvoiceByRHash', { status: r.status, ms: Date.now() - t0, data: r.data });
    return r.data;
  } catch (e) {
    logErr('getInvoiceByRHash', e, Date.now() - t0);
    throw e;
  }
}

async function getInvoiceByRHash(client, rHash) {
  return getInvoiceByRHashBase64(client, rHash);
}

// Exports CJS explícitos
module.exports = {
  makeLndClient,
  getInfo,
  walletBalance,
  channelBalance,
  newAddress,
  createInvoice,
  getInvoiceByRHashBase64,
  getInvoiceByRHash,
};
