import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// @ts-ignore Node backend stays outside browser bundle.
import { handle } from "../../api/studio.mjs";

// Relative base so the built app loads from Type's artifact preview URLs.
export default defineConfig({
  base: "./",
  plugins: [react(), { name: "studio-local-api", configureServer(server) { server.middlewares.use("/api/studio", (req, res) => { void handle(req, res, { localDev: true }); }); } }],
});
