import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Cognito's buffer dependency expects Node's global; browsers use globalThis.
  define: { global: "globalThis" },
});
