const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { processRsvp } = require('../lib/rsvp.cjs');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);

function loadLocalEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.m4a': 'audio/mp4',
  '.woff2': 'font/woff2',
};

http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/api/rsvp') {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 16_384) request.destroy();
    });
    request.on('end', async () => {
      try {
        const entry = await processRsvp(JSON.parse(body));
        const dataDirectory = path.join(root, 'data');
        const dataFile = path.join(dataDirectory, 'rsvps.json');
        fs.mkdirSync(dataDirectory, { recursive: true });
        const current = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : [];
        current.push(entry);
        fs.writeFileSync(dataFile, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
        response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ ok: true, messageId: entry.telegramMessageId }));
      } catch (error) {
        console.error(`RSVP yuborilmadi: ${error.message}`);
        response.writeHead(error.message === 'Ism kiritilmagan' ? 400 : 502, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ ok: false, error: error.message }));
      }
    });
    return;
  }

  const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Sahifa topilmadi');
    return;
  }

  const stat = fs.statSync(filePath);
  const range = request.headers.range;
  const headers = {
    'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  };
  if (range) {
    const [startText, endText] = range.replace(/bytes=/, '').split('-');
    const start = Number(startText);
    const end = endText ? Number(endText) : stat.size - 1;
    response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(filePath, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, { ...headers, 'Content-Length': stat.size });
  fs.createReadStream(filePath).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Samo taklifnoma: http://localhost:${port}`);
});
