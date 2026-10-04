import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base so the built app loads from Type's artifact preview URLs.
export default defineConfig({
  base: "./",
  plugins: [react(), {
    name: "studio-local-api",
    configureServer(server) {
      server.middlewares.use("/api/studio", (req, res) => {
        // Load the Node-only Vercel handler only for the local dev server.
        // Keeping it out of Vite's build-time module graph avoids pulling the
        // provider adapters into the browser build and keeps CI deterministic.
        void import("../../api/studio.mjs").then(({ handle }) => handle(req, res, { localDev: true }));
      });
    },
  }],
});

