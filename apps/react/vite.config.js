import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/user": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
      "/matches": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
      "/catalogs": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
      "/swipes": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
    },
  },
});
