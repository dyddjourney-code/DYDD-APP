import type Stripe from "stripe";
export const dc3CouponId="dydd_dc3_personal_50_v1";
/** App code only: server selects a fixed Personal-only TEST coupon, never a public promo box. */
export async function dc3PersonalCoupon(stripe: Stripe, capability: string, code: unknown): Promise<string | null> {
 if (code === undefined || code === null || code === "") return null;
 if (typeof code !== "string" || code.trim().toUpperCase() !== "DC3" || capability !== "personal")
  throw new Error("DC3 applies only to the separate Personal membership.");
 const coupon=await stripe.coupons.retrieve(dc3CouponId,{expand:["applies_to"]});
 if(coupon.livemode===false && coupon.valid && coupon.duration==="forever" && coupon.percent_off===50 &&
   coupon.applies_to?.products.length===1 && coupon.applies_to.products[0]==="prod_VZFrqe69t5RxtC")return coupon.id;
 throw new Error("DC3 Personal discount is not configured. No full-price checkout was started.");
}
