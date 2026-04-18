import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

type BillingPlan = 'monthly' | 'yearly';

type CheckoutRequest = {
  plan: BillingPlan;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  customerEmail?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeMonthlyPriceId = Deno.env.get('STRIPE_PRICE_MONTHLY') ?? '';
const stripeYearlyPriceId = Deno.env.get('STRIPE_PRICE_YEARLY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getPriceId = (plan: BillingPlan) => (plan === 'yearly' ? stripeYearlyPriceId : stripeMonthlyPriceId);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Missing Stripe or Supabase environment configuration.' }, 500);
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return json({ error: 'Missing Authorization header.' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const body = (await request.json()) as CheckoutRequest;
  const priceId = getPriceId(body.plan);

  if (!priceId) {
    return json({ error: `Missing Stripe price id for plan "${body.plan}".` }, 500);
  }

  const payload = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    client_reference_id: user.id,
    'metadata[userId]': user.id,
    'metadata[plan]': body.plan,
    'subscription_data[metadata][userId]': user.id,
    'subscription_data[metadata][plan]': body.plan,
    ...(body.customerEmail ? { customer_email: body.customerEmail } : {}),
  });

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  const stripeData = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return json({ error: stripeData.error?.message ?? 'Stripe checkout creation failed.' }, 500);
  }

  return json({ id: stripeData.id, url: stripeData.url });
});
