const https = require('https');

const endpoints = [
  'https://services.polkadothub-rpc.com/testnet',
  'https://services.polkadothub-rpc.com/mainnet',
  'https://services.polkadothub-rpc.com/',
  'https://eth-rpc-testnet.polkadot.io/',
  'https://eth-rpc.polkadot.io/',
  'https://api.polkadothub-rpc.com/',
];

const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] });
let done = 0;

endpoints.forEach(url => {
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
        console.log(url + ' -> ' + res.statusCode + ' ' + d.slice(0, 300));
        if (++done === endpoints.length) process.exit(0);
      });
    }
  );
  req.on('error', e => {
    console.log(url + ' -> ERROR: ' + e.message);
    if (++done === endpoints.length) process.exit(0);
  });
  req.setTimeout(12000, () => {
    req.destroy();
    console.log(url + ' -> TIMEOUT');
    if (++done === endpoints.length) process.exit(0);
  });
  req.write(body);
  req.end();
});
