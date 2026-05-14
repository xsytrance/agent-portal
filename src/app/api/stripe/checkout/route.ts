import { NextResponse } from 'next/server';
import { getUserContext } from '@/app/lib/auth/userContext';
import { isDatabaseConfigured } from '@/app/lib/db/prisma';
import { getCreditPack } from '@/app/lib/wallet/creditPacks';
import { getStripeClient } from '@/app/lib/stripe/stripeClient';

const priceEnvByDollars: Record<number, string | undefined> = {
  5: process.env.STRIPE_PRICE_5,
  10: process.env.STRIPE_PRICE_10,
  20: process.env.STRIPE_PRICE_20,
  50: process.env.STRIPE_PRICE_50,
};

export async function POST(request: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ success: false, error: 'Stripe is not configured' }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Database is required for wallet purchases' }, { status: 503 });
  }

  let body: { dollars?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const pack = getCreditPack(Number(body.dollars));
  if (!pack) {
    return NextResponse.json({ success: false, error: 'Unsupported credit pack' }, { status: 400 });
  }

  const user = await getUserContext(request);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const configuredPrice = priceEnvByDollars[pack.dollars];

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      client_reference_id: user.userId,
      metadata: {
        userId: user.userId,
        dollars: String(pack.dollars),
        microcredits: pack.microcredits.toString(),
      },
      line_items: [
        configuredPrice
          ? { price: configuredPrice, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: pack.amountCents,
                product_data: {
                  name: `${pack.label} Agent Portal credits`,
                },
              },
            },
      ],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Stripe checkout session creation failed',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    checkoutUrl: session.url,
    sessionId: session.id,
  });
}
