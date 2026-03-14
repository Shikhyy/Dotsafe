const https = require('https');

function rpcCall(url, method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        port: 443,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve(JSON.parse(d)));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

const TESTNET = 'https://eth-rpc-testnet.polkadot.io/';
const ADDR = '0x94cC3d0eccb4d26bB5341BfdE319B28E92D5e85d';

async function main() {
  const [chain, bal, nonce, gasPrice] = await Promise.all([
    rpcCall(TESTNET, 'eth_chainId', []),
    rpcCall(TESTNET, 'eth_getBalance', [ADDR, 'latest']),
    rpcCall(TESTNET, 'eth_getTransactionCount', [ADDR, 'latest']),
    rpcCall(TESTNET, 'eth_gasPrice', []),
  ]);

  console.log('TestNet chainId:', chain.result, `= ${parseInt(chain.result, 16)}`);
  console.log('TestNet balance planks:', BigInt(bal.result).toString());
  // Paseo (PAS) uses 10 decimals
  console.log('TestNet balance PAS (10 dec):', (Number(BigInt(bal.result)) / 1e10).toFixed(4));
  // Maybe 12 decimals  
  console.log('TestNet balance PAS (12 dec):', (Number(BigInt(bal.result)) / 1e12).toFixed(4));
  console.log('TestNet nonce:', parseInt(nonce.result, 16));
  console.log('TestNet gasPrice:', parseInt(gasPrice.result, 16));
}

main().catch(console.error);
