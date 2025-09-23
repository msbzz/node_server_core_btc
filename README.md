
---

# I- Loja BTC Backend — README de Ativação, Estrutura e Testes (Testnet)

---

## 0) Visão geral

Este backend Node/Express faz a ponte entre:

* **Bitcoin Core (testnet)** — RPC via **cookie** (ou user/pass) para operações **on-chain**.
* **LND da Loja (testnet)** — REST (TLS + **macaroon**) para operações **Lightning** (faturas BOLT11, pagamentos, saldos/canais).
* **Frontend / Testes** — você exercita o backend pelo **navegador** (GET) e pelo **Insomnia** (GET/POST).

**Porta padrão do backend:** `http://127.0.0.1:3010` (configurável via `.env`).

[Ir para o Tutorial de Instalação core e lnds](https://github.com/msbzz/btc-testnet-core-lnds-electrum)

---

## 1) Requisitos

* **Windows 11** (ambiente atual do projeto) ou equivalente
* **Node.js 18+** e **npm**
* **Bitcoin Core** em **testnet** com RPC ativo (porta padrão `18332`) e **cookie auth** habilitado
* **LND (Loja)** em **testnet**, REST exposto (ex.: `https://127.0.0.1:8082`), com acesso ao **`tls.cert`** e **`admin.macaroon`**
* **Insomnia** instalado (para chamadas POST/GET mais elaboradas)

> **Sobre a pasta `testnet3`:** é **padrão do Core**. Na testnet, o diretório de dados é `...\Bitcoin\testnet3\`. É aí que mora o arquivo `.cookie` usado pela autenticação.
> **Sobre `prune`:** você já usa `-prune=5000`. Na **testnet** o Core baixa só os blocos necessários (não toda a blockchain como na mainnet).
---

## 2) Estrutura do Projeto

```
.
├─ .env
├─ package.json
├─ server.js
├─ config/
│  ├─ index.js          # Carrega variáveis (.env) e expõe ENV (Core/LND/WALLET/PORT)
│  └─ core.js           # Cliente RPC do Core (cookie ou user/pass) + helpers
├─ routes/
│  ├─ index.js          # Monta todos os routers em /api
│  ├─ healthRoutes.js   # /api/health   (estado Core + modo de auth + wallet + flag LND)
│  ├─ walletRoutes.js   # /api/wallet   (saldo on‑chain, envio, etc.)
│  ├─ lndRoutes.js      # /api/ln       (health, saldos wallet/channel, address, invoice, pay)
│  ├─ devRoutes.js      # /api/dev      (apoio/diagnóstico em dev)
│  └─ ...               # outros stubs/compat se houver
└─ services/
   ├─ bitcoinService.js # Abstrações Core (getBlockchainInfo, getNewAddress, sendToAddress…)
   ├─ lndService.js     # Cliente REST p/ LND (axios + TLS + macaroon)
   └─ utils.js          # utilidades (ex.: BIP21)
```

---

## 3) Configuração (.env)

```ini
DEV=1
PORT=3010

# ---- Bitcoin Core (TESTNET) ----
BITCOIN_RPC_URL=http://127.0.0.1:18332
BITCOIN_COOKIE_PATH=C:\Users\<seu-usuario>\AppData\Roaming\Bitcoin\testnet3\.cookie

# Wallet default do Core
WALLET=loja_wallet

# ---- LND da Loja (TESTNET) ----
LND_REST_URL=https://127.0.0.1:8082
LND_TLS_CERT_PATH=C:\IndA\tls.cert
LND_MACAROON_PATH=C:\IndA\data\chain\bitcoin\testnet\admin.macaroon
```

---

## 4) Subindo o backend

```bash
npm install
node server.js
```

Esperado:

```
node_service ON http://127.0.0.1:3010
```

---

## 5) Testes no navegador (GET)

Cole no navegador com o backend rodando:

* [http://127.0.0.1:3010/\_\_ping](http://127.0.0.1:3010/__ping)
* [http://127.0.0.1:3010/api/health](http://127.0.0.1:3010/api/health)
* [http://127.0.0.1:3010/api/wallet/balance](http://127.0.0.1:3010/api/wallet/balance)
* [http://127.0.0.1:3010/api/ln/health](http://127.0.0.1:3010/api/ln/health)
* [http://127.0.0.1:3010/api/ln/wallet/balance](http://127.0.0.1:3010/api/ln/wallet/balance)
* [http://127.0.0.1:3010/api/ln/channel/balance](http://127.0.0.1:3010/api/ln/channel/balance)
* [http://127.0.0.1:3010/api/ln/newaddress](http://127.0.0.1:3010/api/ln/newaddress)

---

## 6) Testes no Insomnia

### GET

* `GET http://127.0.0.1:3010/__ping`
* `GET http://127.0.0.1:3010/api/health`
* `GET http://127.0.0.1:3010/api/wallet/balance`
* `GET http://127.0.0.1:3010/api/ln/health`
* `GET http://127.0.0.1:3010/api/ln/wallet/balance`
* `GET http://127.0.0.1:3010/api/ln/channel/balance`
* `GET http://127.0.0.1:3010/api/ln/invoice/:rhash` *(substituir `:rhash` pelo hash da fatura)*

### POST

6.1. **Enviar on-chain pelo Core**
   `POST http://127.0.0.1:3010/api/wallet/send`
   Body:

   ```json
   {
     "to": "tb1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     "amount": 0.0001,
     "fee": 0.0001,
     "subtractFeeFromAmount": false
   }
   ```

6.2. **Gerar invoice Lightning (Loja)**
   `POST http://127.0.0.1:3010/api/ln/invoice`
   Body:

   ```json
   {
     "amount": 80000,
     "memo": "Pedido #123 (Loja)"
   }
   ```

6.3. **Pagar invoice Lightning**
   `POST http://127.0.0.1:3010/api/ln/pay`
   Body:

   ```json
   {
     "payreq": "lnbc1..."
   }
   ```

---

## 7) Fluxo de teste ponta a ponta

7.1. **Verifique status**:
   GET `/api/health` e `/api/ln/health`.
7.2. **Cheque saldos**:
   GET `/api/wallet/balance` e `/api/ln/wallet/balance`.
7.3. **Loja gera fatura**:
   POST `/api/ln/invoice`.
7.4. **Cliente paga fatura**:
   POST `/api/ln/pay`.
7.5. **Consultar invoice**:
   GET `/api/ln/invoice/:rhash`.
7.6. **Conferir saldos novamente**.

 