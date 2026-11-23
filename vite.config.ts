import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const midtransServerKey =
    env.AP_MIDTRANS_SERVER_KEY ||
    env.VITE_MIDTRANS_SERVER_KEY ||
    process.env.AP_MIDTRANS_SERVER_KEY ||
    process.env.MIDTRANS_SERVER_KEY ||
    ''
  const midtransClientKey =
    env.AP_MIDTRANS_CLIENT_KEY ||
    env.VITE_MIDTRANS_CLIENT_KEY ||
    'Mid-client-yRBpRaqmL0lFDRLN'
  const midtransIsProd =
    env.AP_MIDTRANS_IS_PRODUCTION === 'true' ||
    env.VITE_MIDTRANS_IS_PRODUCTION === 'true'

  return {
    envPrefix: ['VITE_', 'AP_'],
    define: {
      'process.env.IS_PREACT': JSON.stringify('false'),
      'process.env.AP_MIDTRANS_SERVER_KEY': JSON.stringify(midtransServerKey),
      'process.env.AP_MIDTRANS_CLIENT_KEY': JSON.stringify(midtransClientKey),
      'process.env.AP_MIDTRANS_IS_PRODUCTION': JSON.stringify(midtransIsProd ? 'true' : 'false'),
      'process.env.VITE_MIDTRANS_CLIENT_KEY': JSON.stringify(midtransClientKey),
      'process.env.VITE_MIDTRANS_IS_PRODUCTION': JSON.stringify(midtransIsProd ? 'true' : 'false'),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        'sonner': path.resolve(import.meta.dirname, './src/lib/toast-silencer.ts'),
      },
    },
    server: {
      port: 3005,
      host: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', async (_err, req: any, res: any) => {
              const url = req.url || ''
              if (url.includes('/billing/midtrans-token') && req.method === 'POST') {
                try {
                  const auth = Buffer.from(`${midtransServerKey}:`).toString('base64')
                  const orderId = `AC-DEV-${Date.now()}`
                  const snapRes = await fetch(
                    midtransIsProd
                      ? 'https://app.midtrans.com/snap/v1/transactions'
                      : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Basic ${auth}`,
                      },
                      body: JSON.stringify({
                        transaction_details: { order_id: orderId, gross_amount: 85000 },
                        customer_details: { first_name: 'Anticeil Dev User', email: 'dev@anticeil.com' },
                        item_details: [{ id: 'dev_plan', price: 85000, quantity: 1, name: 'Anticeil Nectar Sandbox' }],
                      }),
                    }
                  )
                  const snapData: any = await snapRes.json()
                  if (snapData?.token && res && !res.headersSent) {
                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.end(
                      JSON.stringify({
                        snapToken: snapData.token,
                        redirectUrl: snapData.redirect_url,
                        orderId,
                        clientKey: midtransClientKey,
                      })
                    )
                    return
                  }
                } catch {}
              }
              if (url.includes('/billing/midtrans-verify') && req.method === 'POST') {
                if (res && !res.headersSent) {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: true, status: 'settlement', message: 'Verified' }))
                  return
                }
              }
              if (res && 'writeHead' in res && !res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify([]))
              }
            })
          },
        },
      },
    },
  }
})
