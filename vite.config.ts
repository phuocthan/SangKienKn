import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { railwayProxy } from "./scripts/railway-proxy";

export default defineConfig(({ mode }) => {
  const remote = mode === "railway";
  const railway = railwayProxy("https://greenedu.up.railway.app");
  return {
    plugins: [react(), ...(remote ? [railway.plugin] : [])],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "^/api(?:/|\\?|$)": remote
          ? railway.proxy
          : {
              target: "http://127.0.0.1:3001",
              // Preserve browser Host so the API can enforce same-origin writes.
              changeOrigin: false,
            },
      },
    },
  };
});
