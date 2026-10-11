import type { Plugin, ProxyOptions } from "vite";

// Only used by the loopback development server, never the production API.
export function railwayProxy(target: string): {
  plugin: Plugin;
  proxy: ProxyOptions;
} {
  const origin = new URL(target).origin;
  return {
    plugin: {
      name: "greenedu-local-api-origin",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!/^\/api(?:\/|\?|$)/.test(req.url ?? "")) return next();
          let validOrigin = true;
          if (req.headers.origin) {
            try {
              validOrigin =
                new URL(req.headers.origin).host === req.headers.host;
            } catch {
              validOrigin = false;
            }
          }
          if (!validOrigin || req.headers["sec-fetch-site"] === "cross-site") {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: "Yêu cầu khác nguồn bị từ chối." }),
            );
            return;
          }
          next();
        });
      },
    },
    proxy: {
      target: origin,
      changeOrigin: true,
      secure: true,
      cookieDomainRewrite: "",
      configure(proxy) {
        proxy.on("proxyReq", (outgoing, incoming) => {
          if (incoming.headers.origin) outgoing.setHeader("Origin", origin);
        });
        proxy.on("proxyRes", (response) => {
          // The upstream remains HTTPS; the dev browser uses HTTP on loopback.
          const cookies = response.headers["set-cookie"];
          if (cookies)
            response.headers["set-cookie"] = cookies.map((cookie) =>
              cookie.replace(/;\s*Secure\b/gi, ""),
            );
        });
      },
    },
  };
}
