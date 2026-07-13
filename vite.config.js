import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import parseHandler from "./api/parse.js";
import extractDocHandler from "./api/extract-doc.js";

// Runs the Vercel functions locally under `npm run dev` so the flow works
// end-to-end without the Vercel CLI. In production, Vercel serves /api/* itself.
function localApi() {
  const mount = (server, route, handler) => {
    server.middlewares.use(route, (req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch {
          req.body = {};
        }
        // Shim the Vercel res.status().json() API onto Node's ServerResponse.
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        };
        try {
          await handler(req, res);
        } catch (err) {
          res.status(500).json({ error: "Local API error: " + err.message });
        }
      });
    });
  };

  return {
    name: "local-api",
    configureServer(server) {
      mount(server, "/api/parse", parseHandler);
      mount(server, "/api/extract-doc", extractDocHandler);
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose GEMINI_* from .env to the API handler only — never to client code
  // (client env would need a VITE_ prefix, which these deliberately lack).
  const env = loadEnv(mode, process.cwd(), "");
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;

  return {
    plugins: [react(), localApi()],
  };
});
