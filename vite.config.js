import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // Proxies disabled for "Frontend-Only" Mock Mode
            /*
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            },
            '/ws': {
                target: 'ws://localhost:3001',
                ws: true
            },
            '/graphql': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
            */
        }
    }
})
