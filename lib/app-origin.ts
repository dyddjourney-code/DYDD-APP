/** The marketing root/www stay on Squarespace. Cut over only after DNS + HTTPS pass. */
export const canonicalAppOrigin = "https://app.discoverdivine.design";
export const legacyAppOrigin = "https://dydd-online-school.vercel.app";
export const sandboxAppOrigin = "https://dydd-online-school-sandbox.vercel.app";
/** Existing production configuration wins, so preparation cannot strand active sessions. */
export function appOrigin() {
 const value = process.env.DYDD_APP_URL || (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox" ? sandboxAppOrigin : legacyAppOrigin);
 const url = new URL(value);
 if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw Error("Explicit HTTPS app origin required.");
 return url.origin;
}
/** Keep immutable queued report/recovery/reminder links valid after an app-only cutover.
 * Never allow arbitrary origins, sibling previews or production links in sandbox. */
export function isDeliveryAppOrigin(url: URL) {
 if (url.protocol !== "https:" || url.username || url.password) return false;
 const active = appOrigin();
 return url.origin === active || (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "production" && active === canonicalAppOrigin && url.origin === legacyAppOrigin);
}
