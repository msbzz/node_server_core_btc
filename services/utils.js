const invoices = new Map();

function bip21(address, amount, label, message) {
  const q = new URLSearchParams();
  if (amount) q.set('amount', amount.toString());
  if (label) q.set('label', label);
  if (message) q.set('message', message);
  const qs = q.toString();
  return `bitcoin:${address}${qs ? '?' + qs : ''}`;
}

module.exports = { invoices, bip21 };
