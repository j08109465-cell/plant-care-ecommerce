import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiTarget = process.env.PLANTCARE_API_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": apiTarget,
    },
  },
});
