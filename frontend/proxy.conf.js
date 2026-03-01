const PROXY_CONFIG = {
  '/api/**': {
    target: 'http://backend:3410', // Python FastAPI backend
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    followRedirects: true,
    onProxyReq: function (proxyReq, req, res) {
      // Ensure trailing slash for FastAPI compatibility
      if (
        proxyReq.path.startsWith('/api') &&
        !proxyReq.path.includes('.') &&
        !proxyReq.path.endsWith('/')
      ) {
        const hasQuery = proxyReq.path.includes('?');
        if (hasQuery) {
          const [path, query] = proxyReq.path.split('?');
          proxyReq.path = path + '/?' + query;
        } else {
          proxyReq.path = proxyReq.path + '/';
        }
      }
      console.log('[PROXY] Request:', req.method, req.url);
      console.log('[PROXY] Target:', proxyReq.path);
    },
    onProxyRes: function (proxyRes, req, res) {
      console.log('[PROXY] Response:', proxyRes.statusCode, req.url);
    },
    onError: function (err, req, res) {
      console.error('[PROXY] Error:', err.message);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end('Proxy error: ' + err.message);
    },
  },
  '/uploads/**': {
    target: 'http://backend:3410',
    secure: false,
    changeOrigin: true,
  },
};

module.exports = PROXY_CONFIG;
