// services/bitcoinService.js
const { WALLET } = require('../config'); // deve expor WALLET da .env
const { makeRpcClient, listWallets, loadWallet, createWallet } = require('../config/core');

const rpc = makeRpcClient(WALLET);

module.exports = {
  // Saúde: cadeia + wallet atual
  health: async () => {
    const [bc, wi] = await Promise.all([rpc.getBlockchainInfo(), rpc.getWalletInfo()]);
    return { chain: bc.chain, blocks: bc.blocks, wallet: wi.walletname };
  },

  // Novo endereço bech32
  newAddress: async () => {
    const address = await rpc.getNewAddress('', 'bech32');
    return { address };
  },

  // Saldo da wallet default
  balance: async () => {
    const balance = await rpc.getBalance();
    return { wallet: WALLET, balance };
  },

  // Saldo de wallet específica
  balanceOf: async (name) => {
    const client = makeRpcClient(name);
    const balance = await client.getBalance();
    return { wallet: name, balance };
  },

  // Envio on-chain
  sendToAddress: async (address, amountBtc) => {
    const txid = await rpc.sendToAddress(address, Number(amountBtc));
    return { txid };
  },

  // Últimas transações
  listTransactions: async (count = 10) => {
    const list = await rpc.listTransactions(count, 0, false);
    return { list };
  },

  // Utilitários de carteira
  listWallets: async () => ({ wallets: await listWallets() }),
  loadWallet: async (name) => loadWallet(name),
  createWallet: async (name) => createWallet(name),
};
