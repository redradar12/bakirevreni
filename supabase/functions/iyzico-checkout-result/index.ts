import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-iyzi-rnd',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  let token = ''

  if (req.method === 'POST') {
    // iyzico sends form-encoded POST: token=xxx&status=success
    // Our frontend sends JSON POST: {token: "xxx"}
    const ct = req.headers.get('Content-Type') || ''
    if (ct.includes('application/json')) {
      try {
        const body = await req.json()
        token = body.token || ''
      } catch (_) { /* fall through */ }
    } else {
      // Try form data from iyzico callback
      try {
        const form = await req.formData()
        token = form.get('token') || ''
      } catch (_) { /* fall through */ }
      // Fallback: read raw body
      if (!token) {
        try {
          const text = await req.text()
          const params = new URLSearchParams(text)
          token = params.get('token') || ''
        } catch (_) { /* fall through */ }
      }
    }

    if (token) {
      // Verify with iyzico API (best-effort, don't block redirect)
      try {
        const apiKey = Deno.env.get('IYZICO_API_KEY')
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY')
        if (apiKey && secretKey) {
          const isSandbox = Deno.env.get('IYZICO_SANDBOX') === 'true'
          const base = isSandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'
          const uriPath = '/payment/iyzipos/checkoutform/auth/ecom/detail'
          const rnd = Date.now().toString() + Math.random().toString(36).slice(2, 10)
          const payloadBody = JSON.stringify({ locale: 'tr', conversationId: Date.now().toString(), token })
          const enc = new TextEncoder().encode(rnd + uriPath + payloadBody)
          const keyData = new TextEncoder().encode(secretKey)
          const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
          const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc)
          const encryptedData = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
          const base64Auth = btoa('apiKey:' + apiKey + '&randomKey:' + rnd + '&signature:' + encryptedData)
          await fetch(base + uriPath, {
            method: 'POST',
            headers: { 'Authorization': 'IYZWSv2 ' + base64Auth, 'x-iyzi-rnd': rnd, 'Content-Type': 'application/json' },
            body: payloadBody,
          })
        }
      } catch (_) { /* ignore verification errors */ }
    }

    // Redirect user to static success page with token as GET param
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://www.bakirevreni.com/odeme-sonuc.html?token=' + encodeURIComponent(token) + '&status=success',
        ...corsHeaders,
      },
    })
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
})
