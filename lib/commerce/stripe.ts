import { isFreeBeta } from "@/lib/environment";
import Stripe from "stripe";

export const fruitLifeProductSlug = "fruitlife_360";
export const fruitLifeStripeProductId = "prod_VHGkNdLwZm3ZMD";
export const fruitLifeStripePriceId =
  process.env.STRIPE_FRUITLIFE_360_PRICE_ID ?? "price_1UGiCWABW64O7Vgmzs10O8Mn";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (isFreeBeta()) throw new Error("Payments are disabled during the free beta.");
  if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox") {
    throw new Error("Payments are disabled in the sandbox.");
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  stripeClient ??= new Stripe(secretKey, {
    appInfo: {
      name: "DYDD Online School",
    },
  });

  return stripeClient;
}

export function getFruitLifeStripePriceId() {
  if (!fruitLifeStripePriceId) {
    throw new Error("Missing STRIPE_FRUITLIFE_360_PRICE_ID.");
  }

  return fruitLifeStripePriceId;
}
