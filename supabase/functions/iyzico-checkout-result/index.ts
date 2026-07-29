import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-iyzi-rnd',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token) {
      return new Response(JSON.stringify({ status: 'failure', errorMessage: 'Token gerekli' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('IYZICO_API_KEY')
    const secretKey = Deno.env.get('IYZICO_SECRET_KEY')
    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ status: 'failure', errorMessage: 'Ödeme ayarları yapılmamış.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rnd = Date.now().toString() + Math.random().toString(36).slice(2, 10)
    const payload = {
      locale: 'tr',
      conversationId: Date.now().toString(),
      token,
    }

    const isSandbox = Deno.env.get('IYZICO_SANDBOX') === 'true'
    const base = isSandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'
    const uriPath = '/payment/iyzipos/checkoutform/auth/ecom/detail'
    const bodyStr = JSON.stringify(payload)

    const enc = new TextEncoder().encode(rnd + uriPath + bodyStr)
    const keyData = new TextEncoder().encode(secretKey)
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc)
    const encryptedData = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

    const authStr = 'apiKey:' + apiKey + '&randomKey:' + rnd + '&signature:' + encryptedData
    const base64Auth = btoa(authStr)

    const res = await fetch(base + uriPath, {
      method: 'POST',
      headers: {
        'Authorization': 'IYZWSv2 ' + base64Auth,
        'x-iyzi-rnd': rnd,
        'Content-Type': 'application/json',
      },
      body: bodyStr,
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : 400,
    })
  } catch (e) {
    return new Response(JSON.stringify({ status: 'failure', errorMessage: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
