import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Check if session exists in database
    const { data: dbSession, error: dbError } = await supabase
      .from('stripe_checkout_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (dbError || !dbSession) {
      throw new Error('Session not found');
    }

    // Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    // Update session status in database
    const { error: updateError } = await supabase
      .from('stripe_checkout_sessions')
      .update({
        status: 'completed',
        payment_status: session.payment_status,
        payment_intent: session.payment_intent
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    return new Response(
      JSON.stringify({
        customer_email: session.customer_email,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_intent: session.payment_intent,
        metadata: dbSession.metadata
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});