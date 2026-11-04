import Stripe from "stripe";
import { getSupabaseConfig } from "@/lib/supabase/config";
export const testCatalog = {
 personal: {price: "price_1UY7LrABW64O7Vgmz0jyqeJk", amount: 1000, recurring: true},
 circle_leadership: {price: "price_1UY7LsABW64O7VgmnXP46x8c", amount: 2000, recurring: true},
 couples_circle: {price: "price_1UY7LsABW64O7Vgma11WguaO", amount: 500, recurring: false},
 designpd: {price: "price_1UY7LsABW64O7Vgmeh47Z54p", amount: 1500, recurring: false},
} as const;
export type TestCapability = keyof typeof testCatalog;
export function testBillingEnabled() {
 return process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox" && process.env.DYDD_BILLING_MODE === "test" &&
 process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF === "atemrshtshxoqnuevvqu";
}
export function assertTestBilling() {
 if (!testBillingEnabled()) throw new Error("TEST billing is available only in the isolated sandbox.");
 const {url}=getSupabaseConfig();
 if(new URL(url).hostname!=="atemrshtshxoqnuevvqu.supabase.co") throw new Error("TEST billing database isolation failed.");
}
export function testBillingOrigin() {
 assertTestBilling();
 const url=new URL(process.env.DYDD_TEST_APP_URL || "https://dydd-online-school-sandbox.vercel.app");
 if(url.origin!=="https://dydd-online-school-sandbox.vercel.app" && !(process.env.NODE_ENV!=="production" && ["localhost","127.0.0.1"].includes(url.hostname)))
 throw new Error("TEST checkout return URL must be the sandbox.");
 return url.origin;
}
export function getTestStripe() {
 assertTestBilling();
 const key=process.env.STRIPE_DYDD_TEST_KEY || process.env.STRIPE_DYDD_RESTRICTED_KEY || "";
 const protectedLocal=!process.env.VERCEL && key.startsWith("oc-sent-v2") && Boolean(process.env.HTTPS_PROXY);
 if(!/^(sk|rk)_test_/.test(key) && !protectedLocal) throw new Error("Configure a Stripe TEST runtime key with Checkout Sessions read/write.");
 return new Stripe(key,{httpClient:Stripe.createFetchHttpClient(),appInfo:{name:"DYDD sandbox TEST checkout"}});
}
export function leadershipCoupon(count:number) {return count>=20?"dydd_circle_leadership_100_v1":count>=10?"dydd_circle_leadership_50_v1":null;}
export function validUuid(value:unknown):value is string {return typeof value==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
