import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { createLedgerEntryInTransaction } from '@/app/lib/wallet/walletService';
import { getStripeClient, getStripeWebhookSecret } from '@/app/lib/stripe/stripeClient';
import { error, info } from '@/app/lib/logger';

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret || !isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Stripe webhook is not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ success: false, error: 'Missing Stripe signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown signature error';
    await error('stripe-webhook', 'Invalid Stripe webhook signature', { details: { message } });
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
  }

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing?.status === 'processed') {
    return NextResponse.json({ success: true, duplicate: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const microcredits = BigInt(session.metadata?.microcredits ?? '0');

    if (!userId || microcredits <= 0n) {
      await error('stripe-webhook', 'Checkout session missing wallet metadata', {
        details: { sessionId: session.id },
      });
      return NextResponse.json({ success: false, error: 'Missing wallet metadata' }, { status: 400 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.stripeWebhookEvent.upsert({
          where: { stripeEventId: event.id },
          update: {
            status: 'processing',
            errorMessage: null,
            payload: event as unknown as object,
          },
          create: {
            stripeEventId: event.id,
            type: event.type,
            status: 'processing',
            payload: event as unknown as object,
          },
        });

        await createLedgerEntryInTransaction(tx, {
          userId,
          type: 'credit_purchase',
          amountMicrocredits: microcredits,
          idempotencyKey: `stripe:checkout:${session.id}`,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          description: `Stripe credit purchase ${session.metadata?.dollars ? `$${session.metadata.dollars}` : ''}`.trim(),
          metadata: {
            stripeEventId: event.id,
            amountTotal: session.amount_total,
            currency: session.currency,
          },
        });

        await tx.stripeWebhookEvent.update({
          where: { stripeEventId: event.id },
          data: {
            status: 'processed',
            processedAt: new Date(),
            errorMessage: null,
          },
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet credit failed';
      await prisma.stripeWebhookEvent.upsert({
        where: { stripeEventId: event.id },
        update: {
          status: 'failed',
          errorMessage: message,
          payload: event as unknown as object,
        },
        create: {
          stripeEventId: event.id,
          type: event.type,
          status: 'failed',
          errorMessage: message,
          payload: event as unknown as object,
        },
      });
      await error('stripe-webhook', 'Failed to credit wallet from checkout session', {
        details: { userId, sessionId: session.id, message },
      });
      return NextResponse.json({ success: false, error: 'Wallet credit failed' }, { status: 500 });
    }

    await info('stripe-webhook', 'Credited wallet from checkout session', {
      details: { userId, sessionId: session.id, microcredits: microcredits.toString() },
    });
  } else {
    await prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: event.id },
      update: { status: 'processed', processedAt: new Date(), payload: event as unknown as object },
      create: {
        stripeEventId: event.id,
        type: event.type,
        status: 'processed',
        processedAt: new Date(),
        payload: event as unknown as object,
      },
    });
  }

  return NextResponse.json({ success: true });
}
