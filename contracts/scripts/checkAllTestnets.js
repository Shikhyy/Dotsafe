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
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch(e) { resolve({_raw: d, statusCode: res.statusCode}); }
        });
      }
    );
    req.on('error', e => { resolve({_error: e.message}); });
    req.setTimeout(10000, () => { req.destroy(); resolve({_error: 'timeout'}); });
    req.write(body);
    req.end();
  });
}

const endpoints = [
  'https://services.polkadothub-rpc.com/testnet',
  'https://eth-rpc-testnet.polkadot.io/',
];

const ADDR = '0x94cC3d0eccb4d26bB5341BfdE319B28E92D5e85d';

async function main() {
  for (const url of endpoints) {
    const [chain, bal, gasPrice] = await Promise.all([
      rpcCall(url, 'eth_chainId', []),
      rpcCall(url, 'eth_getBalance', [ADDR, 'latest']),
      rpcCall(url, 'eth_gasPrice', []),
    ]);
    console.log(`\n${url}:`);
    console.log('  chainId:', chain.result, `= ${parseInt(chain.result||'0x0', 16)}`);
    console.log('  balance PAS:', (Number(BigInt(bal.result||'0x0')) / 1e10).toFixed(4), 'PAS');
    console.log('  gasPrice:', parseInt(gasPrice.result||'0x0', 16));
  }
}

main().catch(console.error);
