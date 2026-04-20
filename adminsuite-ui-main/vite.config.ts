import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/login': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return '/index.html';
          }
        }
      },
      '/register': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return '/index.html';
          }
        }
      },
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true
      },
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
