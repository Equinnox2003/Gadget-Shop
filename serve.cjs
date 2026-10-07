// Serve the included Expo web builds with the isolation headers required by expo-sqlite.
// Uses only Node's built-in modules; npm install is not needed for this mode.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const title = 'Gadget Shop';
const args = process.argv.slice(2);
const portArgs = args.filter((arg) => arg !== '--no-open');
const port = Number(portArgs[0] ?? 8083);
if (portArgs.length > 1 || !Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Usage: node serve.cjs [port] [--no-open]');
  process.exit(1);
}
const root = path.resolve(__dirname, 'web-build');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('The browser build is missing. Extract the complete ZIP and try again.');
  process.exit(1);
}
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Invalid URL'); return; }
  const candidate = path.resolve(root, `.${pathname}`);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const choices = [candidate, `${candidate}.html`, path.join(candidate, 'index.html')];
  let file = choices.find((item) => fs.existsSync(item) && fs.statSync(item).isFile());
  if (!file && !path.extname(pathname)) file = path.join(root, 'index.html');
  if (!file) { res.writeHead(404); res.end('File not found'); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
  res.setHeader('Content-Length', fs.statSync(file).size);
  res.writeHead(200);
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = fs.createReadStream(file);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the other app or choose a different port.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}`;
  console.log(`\n${title} is ready: ${url}\nKeep this terminal open. Press Ctrl+C to stop.\n`);
  if (process.argv.includes('--no-open')) return;
  const command = process.platform === 'win32' ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const browser = spawn(command, args, { stdio: 'ignore', detached: true });
  browser.on('error', () => console.log(`Open ${url} in your browser.`));
  browser.unref();
});
