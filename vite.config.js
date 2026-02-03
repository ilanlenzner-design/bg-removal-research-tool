import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/replicate': {
                target: 'https://api.replicate.com/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/replicate/, '')
            }
        }
    }
})
