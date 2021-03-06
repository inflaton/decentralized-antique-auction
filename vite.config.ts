import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import WindiCSS from 'vite-plugin-windicss'
import inject from '@rollup/plugin-inject'
// import mix from 'vite-plugin-mix'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  console.log(`command: ${command} mode: ${mode}`)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [vue(), WindiCSS()],
    server: {
      port: env.PORT || 3000,
    },
    resolve: {
      alias: {
        web3: 'web3/dist/web3.min.js',
        'vue-dapp': resolve(__dirname, './vue-dapp/index.ts'),
      },
    },
    build: {
      chunkSizeWarningLimit: 3600,
      rollupOptions: {
        plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  }
})
