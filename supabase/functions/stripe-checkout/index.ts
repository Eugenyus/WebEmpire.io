import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17.7.0';

// 🌍 Env vars
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    const {
      price_id,
      success_url,
      cancel_url,
      mode = 'payment',
      customer_email,
      full_name,
      // Registration form data
      income_min,
      income_max,
      time_commitment,
      budget_min,
      budget_max,
      skill_level,
      interest_area,
    } = body;

    // ✅ Validate inputs
    if (
      typeof price_id !== 'string' || price_id.trim() === '' ||
      typeof success_url !== 'string' || success_url.trim() === '' ||
      typeof cancel_url !== 'string' || cancel_url.trim() === '' ||
      typeof customer_email !== 'string' || customer_email.trim() === '' ||
      typeof full_name !== 'string' || full_name.trim() === ''
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Lookup interest area from DB
    const { data: interestArea, error: interestError } = await supabase
      .from('interest_areas')
      .select('id, title, price')
      .eq('stripe_price_id', price_id)
      .single();

    if (interestError || !interestArea) {
      console.error('❌ Invalid price_id. Not found in interest_areas table.');
      return new Response(
        JSON.stringify({ error: 'Invalid price ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode,
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      customer_email,
    });

    // ✅ Insert into Supabase
    const { error: dbError } = await supabase.from('stripe_checkout_sessions').insert({
      session_id: session.id,
      customer_email,
      full_name,
      amount_total: (session.amount_total || 0) / 100, // convert to dollars
      currency: session.currency,
      payment_status: session.payment_status,
      status: 'pending',
      // Registration form data
      income_min,
      income_max,
      time_commitment,
      budget_min,
      budget_max,
      skill_level,
      interest_area,
      metadata: {
        price_id,
        success_url,
        cancel_url,
        interest_area_id: interestArea.id,
        interest_area_title: interestArea.title,
      },
    });

    if (dbError) {
      console.error('❌ Error saving session to Supabase:', dbError);
      throw new Error('Failed to store session');
    }

    // ✅ Return Stripe checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Stripe checkout error:', error.message || error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});