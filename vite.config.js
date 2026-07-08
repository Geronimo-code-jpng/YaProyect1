import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env": env,
    },
    server: {
      allowedHosts: ["unadvocated-justus-opticly.ngrok-free.dev"],
    },
    build: {
      rolldownOptions: {
        chunkSizeWarningLimit: 1000,
      },
    },
  };
});
