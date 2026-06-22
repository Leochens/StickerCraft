import type { Connect, PreviewServer, ViteDevServer } from 'vite';

const AGNES_ASSET_PROXY_PREFIX = '/agnes-asset-proxy';

const isAllowedAgnesHost = (hostname: string) => (
  hostname.endsWith('agnes-ai.com') || hostname.endsWith('agnes-ai.space')
);

const createAgnesAssetProxyMiddleware = (): Connect.NextHandleFunction => (
  async (req, res, next) => {
    if (!req.url?.startsWith(AGNES_ASSET_PROXY_PREFIX)) {
      next();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end('Method not allowed');
      return;
    }

    const remainder = req.url.slice(AGNES_ASSET_PROXY_PREFIX.length);
    const match = remainder.match(/^\/([^/?#]+)(\/[^?#]*)?/);

    if (!match) {
      res.statusCode = 400;
      res.end('Invalid Agnes asset proxy path');
      return;
    }

    const hostname = match[1];
    const pathname = match[2] || '/';
    const searchIndex = remainder.indexOf('?');
    const search = searchIndex >= 0 ? remainder.slice(searchIndex) : '';

    if (!isAllowedAgnesHost(hostname)) {
      res.statusCode = 403;
      res.end('Host not allowed');
      return;
    }

    try {
      const targetUrl = `https://${hostname}${pathname}${search}`;
      const upstream = await fetch(targetUrl, { method: req.method });

      res.statusCode = upstream.status;

      const contentType = upstream.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (req.method === 'HEAD' || !upstream.body) {
        res.end();
        return;
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.end(buffer);
    } catch {
      res.statusCode = 502;
      res.end('Failed to proxy Agnes asset');
    }
  }
);

const attachAgnesAssetProxy = (server: ViteDevServer | PreviewServer) => {
  server.middlewares.use(createAgnesAssetProxyMiddleware());
};

export const agnesAssetProxyPlugin = () => ({
  name: 'agnes-asset-proxy',
  configureServer(server: ViteDevServer) {
    attachAgnesAssetProxy(server);
  },
  configurePreviewServer(server: PreviewServer) {
    attachAgnesAssetProxy(server);
  },
});
