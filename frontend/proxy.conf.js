const PROXY_CONFIG = {
  '/api/**': {
    target: 'http://backend:3400', // Reverted to backend container name for Docker support
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: function (proxyReq, req, res) {
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
    target: 'http://backend:3400',
    secure: false,
    changeOrigin: true,
  },
};

module.exports = PROXY_CONFIG;
