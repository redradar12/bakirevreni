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
    const { cart, buyer, callbackUrl } = await req.json()
    const apiKey = Deno.env.get('IYZICO_API_KEY')
    const secretKey = Deno.env.get('IYZICO_SECRET_KEY')
    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ status: 'failure', errorMessage: 'Ödeme ayarları yapılmamış.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!cart?.length) {
      return new Response(JSON.stringify({ status: 'failure', errorMessage: 'Sepet boş.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const total = cart.reduce((s: number, i: { price: number; qty?: number }) => s + Number(i.price) * (i.qty || 1), 0)
    if (total <= 0) {
      return new Response(JSON.stringify({ status: 'failure', errorMessage: 'Geçersiz tutar.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rnd = Date.now().toString() + Math.random().toString(36).slice(2, 10)
    const conversationId = Date.now().toString()
    const basketId = 'B' + Date.now()

    let firstName = (buyer?.name || '').trim()
    let lastName = (buyer?.surname || '').trim()
    if (!firstName && buyer?.email) firstName = String(buyer.email).split('@')[0]
    if (!lastName) lastName = firstName || 'Musteri'
    if (!firstName) firstName = 'Musteri'

    let phone = String(buyer?.phone || '').replace(/\D/g, '')
    if (phone.startsWith('0')) phone = phone.slice(1)
    if (phone.length === 10) phone = '90' + phone
    if (!phone.startsWith('90')) phone = '905555555555'
    const gsmNumber = '+' + phone

    const email = buyer?.email || 'musteri@example.com'
    const address = buyer?.address || 'Belirtilmedi'
    const city = buyer?.city || 'Istanbul'
    const contactName = firstName + ' ' + lastName

    const payment = {
      locale: 'tr',
      conversationId,
      price: total.toFixed(2),
      paidPrice: total.toFixed(2),
      currency: 'TRY',
      basketId,
      paymentGroup: 'PRODUCT',
      callbackUrl: 'https://xjmyqadcqpaxlbpfnzja.supabase.co/functions/v1/iyzico-checkout-result',
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: email,
        name: firstName,
        surname: lastName,
        gsmNumber,
        email,
        identityNumber: '11111111111',
        registrationAddress: address,
        city,
        country: 'Turkey',
        zipCode: '34000',
        ip: '85.34.78.112',
      },
      shippingAddress: {
        contactName,
        city,
        country: 'Turkey',
        address,
        zipCode: '34000',
      },
      billingAddress: {
        contactName,
        city,
        country: 'Turkey',
        address,
        zipCode: '34000',
      },
      basketItems: cart.map((i: { id?: string; name: string; price: number; qty?: number }, idx: number) => ({
        id: i.id || String(idx + 1),
        name: i.name || 'Urun',
        category1: 'Genel',
        itemType: 'PHYSICAL',
        price: (Number(i.price) * (i.qty || 1)).toFixed(2),
      })),
    }

    const isSandbox = Deno.env.get('IYZICO_SANDBOX') === 'true'
    const base = isSandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'
    const uriPath = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
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

    // Normalize URL field for frontend
    if (result.status === 'success') {
      result.checkoutFormUrl = result.paymentPageUrl || result.checkoutFormUrl || null
    }

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
