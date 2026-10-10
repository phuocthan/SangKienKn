import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        // Preserve browser Host so the API can enforce same-origin writes.
        changeOrigin: false,
      },
    },
  },
});
