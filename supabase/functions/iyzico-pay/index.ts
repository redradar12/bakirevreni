import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-iyzi-rnd',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const { cart, buyer, callbackUrl } = await req.json()
  const apiKey = Deno.env.get('IYZICO_API_KEY')
  const secretKey = Deno.env.get('IYZICO_SECRET_KEY')
  if (!apiKey || !secretKey) return new Response(JSON.stringify({ error: 'Ödeme ayarları yapılmamış.' }), { status: 400, headers: corsHeaders })

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0)
  const rnd = Date.now().toString() + Math.random().toString(36).slice(2, 10)
  const conversationId = Date.now().toString()
  const basketId = 'B' + Date.now()
  const name = buyer?.name || ''
  const surname = buyer?.surname || ''
  const email = buyer?.email || ''
  const phone = buyer?.phone || ''

  const payment = {
    locale: 'tr',
    conversationId,
    price: total.toFixed(2),
    paidPrice: total.toFixed(2),
    currency: 'TRY',
    installment: 1,
    basketId,
    paymentGroup: 'PRODUCT',
    callbackUrl: callbackUrl || 'https://example.com/callback',
    buyer: {
      id: email,
      name: name || email.split('@')[0],
      surname: surname || ' ',
      gsmNumber: phone || '5555555555',
      email,
      identityNumber: '11111111111',
      registrationAddress: buyer?.address || 'Belirtilmedi',
      city: buyer?.city || 'İstanbul',
      country: 'Turkey',
      zipCode: '34000',
    },
    shippingAddress: {
      contactName: (name || email.split('@')[0]) + ' ' + (surname || ''),
      city: buyer?.city || 'İstanbul',
      country: 'Turkey',
      address: buyer?.address || 'Belirtilmedi',
      zipCode: '34000',
    },
    billingAddress: {
      contactName: (name || email.split('@')[0]) + ' ' + (surname || ''),
      city: buyer?.city || 'İstanbul',
      country: 'Turkey',
      address: buyer?.address || 'Belirtilmedi',
      zipCode: '34000',
    },
    basketItems: cart.map((i, idx) => ({
      id: i.id || idx.toString(),
      name: i.name,
      category1: 'Genel',
      itemType: 'PHYSICAL',
      price: (i.price * (i.qty || 1)).toFixed(2),
    })),
  }

  const isSandbox = Deno.env.get('IYZICO_SANDBOX') === 'true'
  const base = isSandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'
  const uriPath = '/payment/checkoutform/initialize/auth'
  const bodyStr = JSON.stringify(payment)

  const payload = rnd + uriPath + bodyStr
  const enc = new TextEncoder().encode(payload)
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
})
