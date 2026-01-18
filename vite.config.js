import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
// import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { ViteMinifyPlugin } from 'vite-plugin-minify'
import chromeManifest from './manifest.chrome.json'
import firefoxManifest from './manifest.firefox.json'
import { version } from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const manifest = env.VITE_EXTENSION === 'FIREFOX' ? firefoxManifest : chromeManifest
  const browser = env.VITE_EXTENSION === 'FIREFOX' ? 'firefox' : 'chrome'

  const isWebsite = mode === 'website'
  const extensionDir = env.VITE_EXTENSION === 'FIREFOX' ? 'dist/firefox' : 'dist/chrome'
  const outputDir = isWebsite ? 'dist/website' : extensionDir

  return {
    root: isWebsite ? resolve(__dirname, 'website') : __dirname,
    plugins: [
      codeInspectorPlugin({ bundler: 'vite', editor: 'webstorm', hotKeys: ['altKey'] }),
      react(),
      tailwindcss(),
      ...(isWebsite ? [ViteMinifyPlugin()] : [crx({ manifest, browser })]),
    ],
    resolve: {
      alias: {
        '@': `${resolve(__dirname, 'src')}`,
      },
    },
    define: {
      'import.meta.env.APP_VERSION': JSON.stringify(version),
    },
    build: isWebsite
      ? {
          outDir: resolve(__dirname, 'dist/website'),
          sourcemap: false,
          emptyOutDir: true,
          rollupOptions: {
            input: {
              website: resolve(__dirname, 'website/index.html'),
            },
          },
        }
      : {
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
