import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Update session status in database
      const { error: updateError } = await supabase
        .from('stripe_checkout_sessions')
        .update({
          status: 'completed',
          payment_status: session.payment_status,
          payment_intent: session.payment_intent
        })
        .eq('session_id', session.id);

      if (updateError) {
        console.error('Error updating session:', updateError);
      }

      // Insert order record with proper amount conversion
      const { error: orderError } = await supabase
        .from('stripe_orders')
        .insert({
          checkout_session_id: session.id,
          payment_intent_id: session.payment_intent,
          customer_id: session.customer,
          amount_subtotal: (session.amount_subtotal || 0) / 100, // Convert from cents to dollars
          amount_total: (session.amount_total || 0) / 100, // Convert from cents to dollars
          currency: session.currency,
          payment_status: session.payment_status,
          status: 'completed'
        });

      if (orderError) {
        console.error('Error inserting order:', orderError);
      }

      // Update customer email if provided
      if (session.customer_email && session.customer) {
        try {
          await stripe.customers.update(session.customer, {
            email: session.customer_email
          });
        } catch (error) {
          console.error('Error updating customer email:', error);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});