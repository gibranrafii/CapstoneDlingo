const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json; charset=utf-8', '.md':'text/plain; charset=utf-8' };

function createFrontendServer() {
  return http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!file.startsWith(root + path.sep) || pathname.split('/').some(part => part.startsWith('.')) || pathname.startsWith('/node_modules/')) {
        response.writeHead(403); response.end('Forbidden'); return;
      }
      const data = await fs.readFile(file);
      response.writeHead(200, { 'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      response.end(data);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400);
      response.end('File not found');
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 5500);
  createFrontendServer().listen(port, '127.0.0.1', () => console.log(`Frontend: http://127.0.0.1:${port}/`));
}

module.exports = { createFrontendServer };
