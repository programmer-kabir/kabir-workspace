import { defineConfig } from 'vite'
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    watch: {
      ignored: ['**/backend/**']
    }
  }
})

