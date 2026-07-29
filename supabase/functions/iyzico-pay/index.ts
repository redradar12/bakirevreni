import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const { cart, card, buyer } = await req.json()
  const apiKey = Deno.env.get('IYZICO_API_KEY')
  const secretKey = Deno.env.get('IYZICO_SECRET_KEY')
  if (!apiKey || !secretKey) return new Response(JSON.stringify({ error: 'Ödeme ayarları yapılmamış.' }), { status: 400, headers: corsHeaders })

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0)

  const rnd = iyzioRnd()
  const payment = {
    locale: 'tr',
    conversationId: Date.now().toString(),
    price: total.toFixed(2),
    paidPrice: total.toFixed(2),
    currency: 'TRY',
    installment: 1,
    basketId: 'B' + Date.now(),
    paymentChannel: 'WEB',
    paymentGroup: 'PRODUCT',
    paymentCard: {
      cardHolderName: card.name,
      cardNumber: card.number.replace(/\s/g, ''),
      expireMonth: card.month,
      expireYear: card.year,
      cvc: card.cvc,
      registerCard: 0,
    },
    buyer: {
      id: buyer?.id || '0',
      name: buyer?.name || '',
      surname: buyer?.surname || '',
      gsmNumber: buyer?.phone || '',
      email: buyer?.email || '',
      identityNumber: buyer?.tc || '11111111111',
      registrationAddress: buyer?.address || '',
      city: buyer?.city || '',
      country: 'Turkey',
      zipCode: buyer?.zip || '34000',
    },
    shippingAddress: {
      contactName: buyer?.name || '',
      city: buyer?.city || '',
      country: 'Turkey',
      address: buyer?.address || '',
      zipCode: buyer?.zip || '34000',
    },
    billingAddress: {
      contactName: buyer?.name || '',
      city: buyer?.city || '',
      country: 'Turkey',
      address: buyer?.address || '',
      zipCode: buyer?.zip || '34000',
    },
    basketItems: cart.map((i, idx) => ({
      id: i.id || idx.toString(),
      name: i.name,
      category1: i.category || 'Genel',
      itemType: 'PHYSICAL',
      price: (i.price * (i.qty || 1)).toFixed(2),
    })),
  }

  const hashStr = apiKey + payment.conversationId + payment.price + payment.paidPrice + rnd + payment.currency + secretKey
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(hashStr)).then(b => Array.from(new Uint8Array(b)).map(b => b.toString(16).padStart(2, '0')).join(''))

  const body = { ...payment, randomString: rnd, signature: hash }
  const isSandbox = Deno.env.get('IYZICO_SANDBOX') === 'true'
  const base = isSandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'

  const res = await fetch(base + '/payment/auth', {
    method: 'POST',
    headers: {
      'Authorization': 'IYZWS ' + btoa(apiKey + ':' + secretKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const result = await res.json()
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 400,
  })
})

function iyzioRnd() { return Date.now().toString() + Math.random().toString(36).slice(2, 10) }
