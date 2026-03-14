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

const WESTEND = 'https://westend-asset-hub-eth-rpc.polkadot.io';
const ADDR = '0x94cC3d0eccb4d26bB5341BfdE319B28E92D5e85d';

async function main() {
  const [chain, bal, nonce] = await Promise.all([
    rpcCall(WESTEND, 'eth_chainId', []),
    rpcCall(WESTEND, 'eth_getBalance', [ADDR, 'latest']),
    rpcCall(WESTEND, 'eth_getTransactionCount', [ADDR, 'latest']),
  ]);

  console.log('Westend chainId:', chain.result, `= ${parseInt(chain.result, 16)}`);
  console.log('Westend balance raw:', bal.result);
  console.log('Westend balance planks:', BigInt(bal.result).toString());
  console.log('Westend balance WND:', (Number(BigInt(bal.result)) / 1e10).toFixed(4), 'WND');
  console.log('Westend nonce:', parseInt(nonce.result, 16));
}

main().catch(console.error);
