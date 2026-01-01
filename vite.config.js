// import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import zip from 'vite-plugin-zip-pack'
import chromeManifest from './manifest.chrome.json'
import firefoxManifest from './manifest.firefox.json'
import { name, version } from './package.json'

// export default defineConfig({
//   plugins: [codeInspectorPlugin({ bundler: 'vite', editor: 'webstorm', hotKeys: ['altKey'] }), react(), tailwindcss()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
// })
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const manifest = env.VITE_EXTENSION === 'FIREFOX' ? firefoxManifest : chromeManifest
  const outputDir = env.VITE_EXTENSION === 'FIREFOX' ? 'dist/firefox' : 'dist/chrome'

  return {
    plugins: [
      codeInspectorPlugin({ bundler: 'vite', editor: 'webstorm', hotKeys: ['altKey'] }),
      react(),
      tailwindcss(),
      crx({ manifest }),
      zip({ outDir: 'release', outFileName: `${name}-${version}.zip` }),
    ],
    resolve: {
      alias: {
        '@': `${resolve(__dirname, 'src')}`,
      },
    },
    // define: {
    //   'import.meta.env.APP_VERSION': JSON.stringify(packageJson.version),
    // },
    build: {
      outDir: outputDir,
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
    },
  }
})
