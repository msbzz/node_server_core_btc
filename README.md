
---

# I- Loja BTC Backend — README de Ativação, Estrutura e Testes (Testnet)

---

## 0) Visão geral

Este backend Node/Express faz a ponte entre:

* **Bitcoin Core (testnet)** — RPC via **cookie** (ou user/pass) para operações **on-chain**.
* **LND da Loja (testnet)** — REST (TLS + **macaroon**) para operações **Lightning** (faturas BOLT11, pagamentos, saldos/canais).
* **Frontend / Testes** — você exercita o backend pelo **navegador** (GET) e pelo **Insomnia** (GET/POST).

**Porta padrão do backend:** `http://127.0.0.1:3010` (configurável via `.env`).

[Ir para o Tutorial de Instalação core](#ii--tutorial-de-instalacao-bitcoin-core--lnd-loja-e-cliente-no-windows-11)

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

---

# II- Tutorial de Instalacao Bitcoin Core + LND (Loja e Cliente) no Windows 11


> Aqui vou explicar como eu mesmo configurei meu ambiente no Windows 11 para rodar o **Bitcoin Core em testnet** e também duas instâncias do **LND** (uma para a Loja e outra para o Cliente).
> Não é obrigatório seguir exatamente essa estrutura de pastas, mas vou descrever do jeito que eu organizei para manter separado.
 
👉 [Ir para o início](#i--loja-btc-backend--readme-de-ativacao-estrutura-e-testes-testnet)

---


## 1. Baixando os programas

1. **Bitcoin Core**

   * Link: [https://bitcoincore.org/en/download/](https://bitcoincore.org/en/download/)
   * Baixe a versão **Windows x64**.
   * Instale normalmente em `C:\Program Files\Bitcoin\`.

2. **LND (Lightning Network Daemon)**

   * Link: [https://github.com/lightningnetwork/lnd/releases](https://github.com/lightningnetwork/lnd/releases)
   * Baixe o ZIP da versão estável para Windows.
   * Extraia e coloque os binários (`lnd.exe`, `lncli.exe`) em `C:\Ind\`.

---

## 2. Estrutura de pastas que eu uso

* `C:\Ind\` → onde deixei os executáveis `lnd.exe` e `lncli.exe`.
* `C:\IndA\` → dados da **Loja** (config, carteira, logs, tls).
* `C:\IndB\` → dados do **Cliente** (config, carteira, logs, tls).
* `C:\Program Files\Bitcoin\daemon\` → executáveis do Bitcoin Core (`bitcoind.exe`, `bitcoin-cli.exe`, etc).

👉 Essa organização é minha, você pode unificar tudo em uma pasta só se preferir.

---

## 3. Iniciando o **Bitcoin Core** em Testnet

No PowerShell:

```powershell
& 'C:\Program Files\Bitcoin\daemon\bitcoind.exe' `
  -testnet `
  -server `
  -prune=5000 `
  -zmqpubrawblock=tcp://127.0.0.1:28332 `
  -zmqpubrawtx=tcp://127.0.0.1:28333
```

📌 **Observações importantes**:

* O Core cria automaticamente a pasta:
  `C:\Users\<usuario>\AppData\Roaming\Bitcoin\testnet3\`
  O nome **testnet3** é padrão da rede de testes atual (é a terceira versão da testnet, por isso o número 3).
* Diferente da mainnet, que precisa baixar a blockchain completa (centenas de GB), aqui usamos o **pruning=5000**. Isso baixa só os blocos recentes, mantendo o essencial para o funcionamento.

---

## 4. Iniciando o **LND Loja**

Script `start-lnd-loja.ps1`:

```powershell
$ck = Get-Content "$env:APPDATA\Bitcoin\testnet3\.cookie"
$u, $p = $ck -split ":",2

& 'C:\Ind\lnd.exe' `
  --lnddir=C:\IndA `
  --alias=Loja-A `
  --bitcoin.active `
  --bitcoin.testnet `
  --bitcoin.node=bitcoind `
  --bitcoind.rpchost=127.0.0.1:18332 `
  --bitcoind.rpcuser=$u `
  --bitcoind.rpcpass=$p `
  --bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332 `
  --bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333 `
  --restlisten=127.0.0.1:8082 `
  --rpclisten=127.0.0.1:10010 `
  --listen=0.0.0.0:9735 `
  --externalip=192.168.0.64:9735
```

---

## 5. Iniciando o **LND Cliente**

Arquivo de configuração `C:\IndB\lnd.conf`:

```ini
alias=Cliente-B

[Application Options]
restlisten=127.0.0.1:8083
rpclisten=127.0.0.1:10012
listen=127.0.0.1:9739

[Bitcoin]
bitcoin.active=1
bitcoin.testnet=1
bitcoin.node=bitcoind

[Bitcoind]
bitcoind.rpchost=127.0.0.1:18332
bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332
bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
```

Script `start-lnd-cliente.ps1`:

```powershell
$ck = Get-Content "$env:APPDATA\Bitcoin\testnet3\.cookie"
$u, $p = $ck -split ":",2

& 'C:\Ind\lnd.exe' `
  --lnddir=C:\IndB `
  --configfile=C:\IndB\lnd.conf `
  --bitcoind.rpcuser=$u `
  --bitcoind.rpcpass=$p
```

---

## 6. Criando e desbloqueando as carteiras

Primeira execução (gera seed):

```powershell
# Loja
& 'C:\Ind\lncli.exe' --rpcserver=127.0.0.1:10010 create

# Cliente
& 'C:\Ind\lncli.exe' --rpcserver=127.0.0.1:10012 create
```

Depois, basta desbloquear:

```powershell
& 'C:\Ind\lncli.exe' --rpcserver=127.0.0.1:10010 unlock   # Loja
& 'C:\Ind\lncli.exe' --rpcserver=127.0.0.1:10012 unlock   # Cliente
```

---

## 7. Testando se está tudo certo

```powershell
# Loja
& 'C:\Ind\lncli.exe' --rpcserver=127.0.0.1:10010 getinfo

# Cliente
& 'C:\Ind\lncli.exe' --rpcserver=127.0.0.1:10012 getinfo
```

---

## ✅ Conclusão

* O Bitcoin Core roda em **testnet3** (esse “3” é o nome oficial da rede de testes atual, não é erro).
* Com `-prune=5000`, eu **não preciso baixar toda a blockchain** (como seria na mainnet). Só baixo e mantenho os blocos mais recentes.
* As instâncias **Loja** e **Cliente** do LND funcionam em paralelo, cada uma com sua pasta (`C:\IndA` e `C:\IndB`).
* O cookie do Core é usado para autenticação automática.

 
