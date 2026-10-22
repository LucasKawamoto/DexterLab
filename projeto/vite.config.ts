import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self' https://hqigbxruqexqiitlmcat.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
}

const developmentHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' ws: https://hqigbxruqexqiitlmcat.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
}

export default defineConfig({
  plugins: [react()],
  server: { headers: developmentHeaders },
  preview: { headers: securityHeaders },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion'
          if (id.includes('gsap')) return 'scroll-motion'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('node_modules/react')) return 'react-core'
        },
      },
    },
  },
})
