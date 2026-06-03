import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-api-proxy",
      configureServer(server) {
        server.middlewares.use("/api-proxy", async (req, res) => {
          try {
            const requestUrl = new URL(req.url, "http://localhost");
            const targetUrl = requestUrl.searchParams.get("url");

            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ detail: "URL da API e obrigatoria." }));
              return;
            }

            const target = new URL(targetUrl);

            if (!["http:", "https:"].includes(target.protocol)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ detail: "Use uma URL http ou https." }));
              return;
            }

            const response = await fetch(target, {
              headers: {
                Accept: "application/json",
              },
            });
            const contentType = response.headers.get("content-type") || "application/json";
            const body = await response.text();

            res.statusCode = response.status;
            res.setHeader("Content-Type", contentType);
            res.end(body);
          } catch (error) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                detail: error?.message || "Erro ao consultar a API.",
              })
            );
          }
        });
      },
    },
  ],

  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },

  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
