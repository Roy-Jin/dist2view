// Service Worker for Dist2View Sandbox
// Intercepts requests to /sb/:sandboxId/* and serves from Cache Storage
//
// NOTE: This file runs outside the TS build pipeline and cannot import config.ts.
// The following values must be kept in sync with src/config.ts:
//   - SANDBOX_URL_PREFIX = '/sb/'
//   - CACHE_NAME_PREFIX  = 'sb-'

const CACHE_PREFIX = 'sb-';

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper to determine content type from file name
function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const mimeTypes = {
    'html': 'text/html; charset=utf-8',
    'htm': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'mjs': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'pdf': 'application/pdf',
    'xml': 'application/xml; charset=utf-8',
    'txt': 'text/plain; charset=utf-8'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept requests for our own origin under /sb/
  if (url.origin === self.location.origin && url.pathname.startsWith('/sb/')) {
    event.respondWith(handleSandboxRequest(event.request, url));
  }
});

async function handleSandboxRequest(request, url) {
  // Path format: /sb/:sandboxId/path/to/file
  const pathParts = url.pathname.split('/');
  if (pathParts.length < 4) {
    return new Response('Invalid sandbox path structure', { status: 400 });
  }
  
  const sandboxId = pathParts[2];
  const cacheName = `${CACHE_PREFIX}${sandboxId}`;
  
  try {
    const cache = await caches.open(cacheName);
    
    // 1. Try exact match
    let cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 2. Try clean URL matches (without query params / hashes)
    const cleanUrl = url.origin + url.pathname;
    cachedResponse = await cache.match(cleanUrl);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 3. Handle directories and SPA routing fallback
    // If the path looks like a directory or SPA route (no extension), search for index.html
    const hasExtension = url.pathname.split('/').pop().includes('.');
    if (!hasExtension) {
      // Try sandbox index.html
      const indexUrl = `${url.origin}/sb/${sandboxId}/index.html`;
      const indexResponse = await cache.match(indexUrl);
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    // 4. Return custom elegant 404
    return new Response(
      `<html>
        <head>
          <title>404 Not Found - Preview Sandbox</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); border: 1px solid #334155; max-width: 450px; }
            h1 { font-size: 3rem; margin: 0 0 1rem; color: #ef4444; font-weight: 800; letter-spacing: -0.05em; }
            h2 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #f1f5f9; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.5rem; }
            .path { font-family: monospace; background: #0f172a; padding: 0.35rem 0.6rem; border-radius: 6px; color: #38bdf8; font-size: 0.85rem; word-break: break-all; }
            .back-btn { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; font-size: 0.9rem; transition: background 0.15s; }
            .back-btn:hover { background: #2563eb; }
          </style>
        </head>
          <body>
            <div class="card">
              <h1>404</h1>
              <h2>File Not Found</h2>
              <p>The requested static file could not be found in your virtual <b>dist</b> cache:</p>
              <p><span class="path">${url.pathname}</span></p>
              <a href="/sb/${sandboxId}/" class="back-btn">Go to index.html</a>
            </div>
          </body>
      </html>`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
    
  } catch (err) {
    return new Response(`Error loading file: ${err.message}`, { status: 500 });
  }
}
