import { NextResponse, type NextRequest } from "next/server";
import { grantFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import { fruitLifeProductSlug, getStripeClient } from "@/lib/commerce/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object;
    const productSlug = checkoutSession.metadata?.product_slug ?? "";
    const userId = checkoutSession.metadata?.user_id ?? "";

    if (productSlug === fruitLifeProductSlug && userId && checkoutSession.payment_status === "paid") {
      const lineItems = await stripe.checkout.sessions.listLineItems(checkoutSession.id, {
        limit: 1,
      });
      await grantFruitLifeEntitlement({
        amountTotal: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        customerEmail: checkoutSession.customer_details?.email ?? checkoutSession.customer_email,
        paymentIntentId:
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id,
        priceId: lineItems.data[0]?.price?.id ?? null,
        stripeCheckoutSessionId: checkoutSession.id,
        stripeCustomerId:
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : checkoutSession.customer?.id,
        userId,
      });
    }
  }

  return NextResponse.json({ received: true });
}
