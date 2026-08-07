const http = require('node:http');
const https = require('node:https');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// --- DEV-ONLY API PROXY ------------------------------------------------------
// The dev server that hands out the JS bundle also forwards /api/* to the
// api-gateway, mirroring what the web app does with Vite's `server.proxy`
// (frontend/web-app/vite.config.js).
//
// This is what makes `expo start --tunnel` actually usable. Expo's tunnel
// carries the BUNDLER only, so a phone that loaded the app over ngrok has no
// route to the gateway — `localhost:3001` on a phone is the phone itself, and a
// LAN IP is useless once the device is on mobile data or a Wi-Fi network that
// isolates clients. Proxying here puts the API on the same origin as the bundle,
// so whatever URL reached Metro reaches the gateway too: localhost, a LAN IP, or
// the public tunnel. The app resolves that origin at runtime in index.js.
//
// Origin only — no path prefix. Inside Docker, compose points this at the
// gateway's service name; natively it defaults to the port `npm run dev:backend`
// listens on.
const API_PROXY_TARGET = new URL(process.env.API_PROXY_TARGET || 'http://localhost:3001');
const transport = API_PROXY_TARGET.protocol === 'https:' ? https : http;

function proxyToGateway(req, res) {
  const upstream = transport.request(
    {
      protocol: API_PROXY_TARGET.protocol,
      hostname: API_PROXY_TARGET.hostname,
      port: API_PROXY_TARGET.port || (API_PROXY_TARGET.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: req.url,
      // The gateway should see itself as the host, not the tunnel.
      headers: { ...req.headers, host: API_PROXY_TARGET.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.on('error', (err) => {
    // Most often the gateway simply isn't up yet. Answer in the shape the app's
    // error handling already expects rather than hanging the request.
    console.warn(`[metro] /api proxy to ${API_PROXY_TARGET.origin} failed: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: `API proxy could not reach ${API_PROXY_TARGET.origin}` }));
  });

  req.pipe(upstream);
}

const config = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });

// Compose rather than replace: nativewind and Expo both install middleware of
// their own, and everything that isn't /api/ has to keep reaching it.
const previousEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const next = previousEnhance ? previousEnhance(metroMiddleware, server) : metroMiddleware;

    return (req, res, continueToMetro) => {
      // The app has no Expo Router API routes, so nothing else here serves /api.
      if (req.url && req.url.startsWith('/api/')) {
        proxyToGateway(req, res);
        return undefined;
      }
      return next(req, res, continueToMetro);
    };
  },
};

module.exports = config;
