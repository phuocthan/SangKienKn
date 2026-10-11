import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root,
  publicDir: fileURLToPath(new URL("../public", import.meta.url)),
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5180, strictPort: true },
  build: {
    outDir: "../.local/garden-preview-build",
    emptyOutDir: true,
    rollupOptions: {
      input: { studio: `${root}index.html`, canvas: `${root}canvas.html` },
    },
  },
});
