import {redirect} from "next/navigation";
import {testBillingEnabled} from "@/lib/commerce/test-billing-config";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
// Compatibility for old bookmarks/Stripe sessions; purchases live in their context.
export default async function Memberships({searchParams}:{searchParams:Promise<{checkout?:string}>}) {
 if(!testBillingEnabled())notFound();
 const params=await searchParams;
 redirect("/hq"+(["returned","cancelled"].includes(params.checkout||"")?"?checkout="+params.checkout:"")+"#purchases");
}
