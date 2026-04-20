// vite.config.ts
import { defineConfig } from "file:///C:/Microservices/adminsuite-ui-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Microservices/adminsuite-ui-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Microservices/adminsuite-ui-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Microservices\\adminsuite-ui-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/login": {
        target: "http://localhost:8888",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        }
      },
      "/register": {
        target: "http://localhost:8888",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        }
      },
      "/api": {
        target: "http://localhost:8888",
        changeOrigin: true
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxNaWNyb3NlcnZpY2VzXFxcXGFkbWluc3VpdGUtdWktbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcTWljcm9zZXJ2aWNlc1xcXFxhZG1pbnN1aXRlLXVpLW1haW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L01pY3Jvc2VydmljZXMvYWRtaW5zdWl0ZS11aS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBwcm94eToge1xuICAgICAgJy9sb2dpbic6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4ODg4JyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBieXBhc3M6IChyZXEpID0+IHtcbiAgICAgICAgICBpZiAocmVxLmhlYWRlcnMuYWNjZXB0ICYmIHJlcS5oZWFkZXJzLmFjY2VwdC5pbmNsdWRlcygndGV4dC9odG1sJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnL2luZGV4Lmh0bWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICcvcmVnaXN0ZXInOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODg4OCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgYnlwYXNzOiAocmVxKSA9PiB7XG4gICAgICAgICAgaWYgKHJlcS5oZWFkZXJzLmFjY2VwdCAmJiByZXEuaGVhZGVycy5hY2NlcHQuaW5jbHVkZXMoJ3RleHQvaHRtbCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJy9pbmRleC5odG1sJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4ODg4JyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICB9LFxuICAgIH1cbiAgfSxcbiAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlTLFNBQVMsb0JBQW9CO0FBQzlULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxVQUFVO0FBQUEsUUFDUixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRLENBQUMsUUFBUTtBQUNmLGNBQUksSUFBSSxRQUFRLFVBQVUsSUFBSSxRQUFRLE9BQU8sU0FBUyxXQUFXLEdBQUc7QUFDbEUsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGFBQWE7QUFBQSxRQUNYLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVEsQ0FBQyxRQUFRO0FBQ2YsY0FBSSxJQUFJLFFBQVEsVUFBVSxJQUFJLFFBQVEsT0FBTyxTQUFTLFdBQVcsR0FBRztBQUNsRSxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUM5RSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
