// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Pings úteis para sanity-check ---
app.get('/__ping', (req, res) => res.json({ ok: true, where: 'app-root' }));
app.get('/api/ln/__ping_direct', (req, res) => res.json({ ok: true, where: 'app-direct' }));

// --- Agregador geral (mantém seu padrão anterior)
try {
  const routesIndex = require('./routes');              // <- se você já tinha
  app.use('/api', routesIndex);                         // monta /api + (o que houver no index)
  console.log('[BOOT] routes/index.js montado em /api');
} catch (e) {
  console.log('[BOOT] routes/index.js não encontrado/ignorando:', e.message);
}

// --- Montagem explícita do LN (garantia do prefixo /api/ln)
try {
  const lnRoutes = require('./routes/lnRoutes');
  app.use('/api/ln', lnRoutes);
  console.log('[BOOT] lnRoutes montado explicitamente em /api/ln');
} catch (e) {
  console.log('[BOOT] routes/lnRoutes não encontrado:', e.message);
}

// --- Impressão segura de rotas (não quebra se _router não existir)
function printRoutesSafe(app) {
  try {
    if (!app._router || !app._router.stack) {
      console.log('[ROUTES] (nenhuma rota montada ou _router indefinido)');
      return;
    }
    console.log('\n[ROUTES]');
    app._router.stack.forEach((layer) => {
      if (layer.name === 'router' && layer.handle?.stack) {
        // extrai prefixo aproximado do RegExp interno
        const src = layer.regexp?.source || '';
        const base = src
          ? '/' + src
              .replace('^\\/', '')
              .replace('\\/?(?=\\/|$)', '')
              .replace(/\$$/i, '')
              .replace(/\\\//g, '/')
          : '';

        layer.handle.stack.forEach((h) => {
          const r = h.route;
          if (!r) return;
          const methods = Object.keys(r.methods).map((m) => m.toUpperCase()).join(',');
          console.log(`${methods.padEnd(10)} ${base}${r.path}`);
        });
      } else if (layer.route) {
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase()).join(',');
        console.log(`${methods.padEnd(10)} ${layer.route.path}`);
      }
    });
    console.log('');
  } catch (e) {
    console.warn('[ROUTES] print skipped:', e.message);
  }
}

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`node_service ON http://127.0.0.1:${PORT}`);
  console.log('[INFO] Testes rápidos:');
  console.log(`  GET http://127.0.0.1:${PORT}/__ping`);
  console.log(`  GET http://127.0.0.1:${PORT}/api/ln/__ping_direct`);
  console.log(`  GET http://127.0.0.1:${PORT}/api/ln/__ping`);
  printRoutesSafe(app);
});
