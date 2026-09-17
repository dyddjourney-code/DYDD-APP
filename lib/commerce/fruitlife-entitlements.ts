import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fruitLifeProductSlug } from "./stripe";

export type FruitLifeEntitlement = {
  id: string;
  status: string;
  stripe_checkout_session_id: string | null;
};

export async function getActiveFruitLifeEntitlement(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("fruitlife_360_entitlements")
    .select("id,status,stripe_checkout_session_id")
    .eq("user_id", userId)
    .eq("product_slug", fruitLifeProductSlug)
    .eq("status", "active")
    .is("consumed_at", null)
    .order("purchased_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data ?? null) as FruitLifeEntitlement | null;
}

export async function userHasFruitLifeEntitlement(userId: string) {
  return Boolean(await getActiveFruitLifeEntitlement(userId));
}

export async function grantFruitLifeEntitlement({
  amountTotal,
  currency,
  customerEmail,
  paymentIntentId,
  priceId,
  stripeCheckoutSessionId,
  stripeCustomerId,
  userId,
}: {
  amountTotal?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
  paymentIntentId?: string | null;
  priceId?: string | null;
  stripeCheckoutSessionId: string;
  stripeCustomerId?: string | null;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("fruitlife_360_entitlements").upsert(
    {
      amount_total: amountTotal ?? null,
      currency: currency ?? "usd",
      customer_email: normalizeEmail(customerEmail),
      metadata: {
        source: "stripe_checkout",
      },
      payment_intent_id: paymentIntentId ?? null,
      price_id: priceId ?? null,
      product_slug: fruitLifeProductSlug,
      purchased_at: now,
      status: "active",
      stripe_checkout_session_id: stripeCheckoutSessionId,
      stripe_customer_id: stripeCustomerId ?? null,
      updated_at: now,
      user_id: userId,
    },
    { onConflict: "stripe_checkout_session_id" },
  );

  if (error) {
    throw error;
  }
}

export async function consumeFruitLifeEntitlement(userId: string, fruitLifeSessionId: string) {
  const entitlement = await getActiveFruitLifeEntitlement(userId);

  if (!entitlement) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("fruitlife_360_entitlements")
    .update({
      consumed_at: now,
      fruitlife_session_id: fruitLifeSessionId,
      status: "consumed",
      updated_at: now,
    })
    .eq("id", entitlement.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("consumed_at", null);

  if (error) {
    throw error;
  }

  return true;
}
