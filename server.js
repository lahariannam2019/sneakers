/**
 * SNEAKO LOCAL E-COMMERCE SERVER
 * --------------------------------------------------------------------
 * High-performance, zero-dependency Node.js HTTP server providing:
 * - Clean URL routing (e.g., /shoes/adidas-kadhi-og -> adidas-kadhi-og.html)
 * - Automatic redirects (e.g., deprecated /contact -> /)
 * - MIME-type resolution with streaming responses
 * - Path traversal security validation
 * - Dynamic fallback caching for static assets
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

async function handleRequest(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. Automatic 302 Redirect: Deprecated contact page -> Home
    if (pathname === '/contact' || pathname === '/contact/' || pathname.startsWith('/contact')) {
      res.writeHead(302, { Location: '/' });
      return res.end();
    }

    // 2. Root route mapping -> index.html
    if (pathname === '/' || pathname === '') {
      return serveFile(path.join(PUBLIC_DIR, 'index.html'), res);
    }

    // 3. Clean path resolution
    const cleanPath = pathname.replace(/^\/+/, '');
    const candidates = [
      path.join(PUBLIC_DIR, cleanPath),
      path.join(PUBLIC_DIR, `${cleanPath}.html`),
      path.join(PUBLIC_DIR, cleanPath, 'index.html')
    ];

    for (const candidate of candidates) {
      // Security: Prevent directory traversal
      const resolved = path.resolve(candidate);
      if (!resolved.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('403 Forbidden: Invalid file path');
      }

      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        return serveFile(resolved, res);
      }
    }

    // 4. Asset fallback proxy from CDN if not already downloaded
    if (pathname.startsWith('/images/') || pathname.startsWith('/assets/') || pathname.startsWith('/sites/')) {
      const remoteUrl = `https://framerusercontent.com${pathname}`;
      try {
        const cdnRes = await fetch(remoteUrl);
        if (cdnRes.ok) {
          const buf = Buffer.from(await cdnRes.arrayBuffer());
          const localDest = path.join(PUBLIC_DIR, cleanPath);
          fs.mkdirSync(path.dirname(localDest), { recursive: true });
          fs.writeFileSync(localDest, buf);
          return serveFile(localDest, res);
        }
      } catch (proxyErr) {
        // Fall through to 404
      }
    }

    // 5. Route Not Found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${pathname}`);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`500 Internal Server Error: ${err.message}`);
  }
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 Sneako — Local Sneaker E-Commerce Store`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${PUBLIC_DIR}`);
  console.log(`=================================================\n`);
});
