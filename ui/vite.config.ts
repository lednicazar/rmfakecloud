import { defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // Alias para el codigo embebido de recalendar en src/calendar/
      '~': join(__dirname, 'src', 'calendar'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: function (id) {
          if (id.includes("node_modules")) {
            if (id.includes("pdf") || id.includes("@react-pdf")) return "pdf";
            if (id.includes("react")) return "react";
            if (id.includes("dayjs") || id.includes("i18next") || id.includes("nanoid")) return "recalendar";
            return "vendor";
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: [
          "mixed-decls",
          "color-functions",
          "global-builtin",
          "import",
        ],
      },
    },
  },
  server: {
	open: false,
	port: 3001,
    proxy: {
      "/ui/api": {
		target: "http://localhost:3000",
		changeOrigin: true
	  },
	  "/api": {
		target: "http://localhost:3002",
		changeOrigin: true
	  }
    },
  },
});
