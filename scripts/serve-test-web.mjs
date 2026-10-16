import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist-test');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    let file = path;
    let data;
    try { data = await readFile(file); }
    catch { file = resolve(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(500); res.end('No se pudo leer la exportación de prueba.'); }
}).listen(4173, '127.0.0.1');
