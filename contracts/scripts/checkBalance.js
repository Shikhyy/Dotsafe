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

const MAINNET = 'https://eth-rpc.polkadot.io/';
const TESTNET = 'https://eth-rpc-testnet.polkadot.io/';
const ADDR = '0x94cC3d0eccb4d26bB5341BfdE319B28E92D5e85d';

async function main() {
  const [mainChain, testChain, mainBal, testBal] = await Promise.all([
    rpcCall(MAINNET, 'eth_chainId', []),
    rpcCall(TESTNET, 'eth_chainId', []),
    rpcCall(MAINNET, 'eth_getBalance', [ADDR, 'latest']),
    rpcCall(TESTNET, 'eth_getBalance', [ADDR, 'latest']),
  ]);

  const toEth = hex => (BigInt(hex) / BigInt(10 ** 10)).toString() + ' (in WND/DOT planks÷10^10)';

  console.log('Mainnet chainId:', mainChain.result, `= ${parseInt(mainChain.result, 16)}`);
  console.log('Testnet chainId:', testChain.result, `= ${parseInt(testChain.result, 16)}`);
  console.log('Mainnet balance:', mainBal.result, `= ${BigInt(mainBal.result)} planks`);
  console.log('Testnet balance:', testBal.result, `= ${BigInt(testBal.result)} planks`);
}

main().catch(console.error);
