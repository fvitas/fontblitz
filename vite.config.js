import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
// import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import chromeManifest from './manifest.chrome.json'
import firefoxManifest from './manifest.firefox.json'
import { version } from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const manifest = env.VITE_EXTENSION === 'FIREFOX' ? firefoxManifest : chromeManifest
  const outputDir = env.VITE_EXTENSION === 'FIREFOX' ? 'dist/firefox' : 'dist/chrome'
  const browser = env.VITE_EXTENSION === 'FIREFOX' ? 'firefox' : 'chrome'

  return {
    plugins: [react(), tailwindcss(), crx({ manifest, browser: browser })],
    resolve: {
      alias: {
        '@': `${resolve(__dirname, 'src')}`,
      },
    },
    define: {
      'import.meta.env.APP_VERSION': JSON.stringify(version),
    },
    build: {
      outDir: outputDir,
      sourcemap: false,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-dom/client'],
          },
        },
      },
    },
  }
})
