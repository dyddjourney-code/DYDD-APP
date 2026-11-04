import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { testBillingEnabled,testCatalog,validUuid,type TestCapability } from "@/lib/commerce/test-billing-config";
import { hasTestEntitlement } from "@/lib/commerce/test-entitlements";
export async function GET(request:Request){
 if(!testBillingEnabled())return NextResponse.json({error:"TEST billing disabled"},{status:404});
 const {data:{user}}=await(await createSupabaseServerClient()).auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in"},{status:401});
 const params=new URL(request.url).searchParams,capability=params.get("capability") as TestCapability;
 if(!Object.hasOwn(testCatalog,capability))return NextResponse.json({error:"Invalid capability"},{status:400});
 const scope=capability==="designpd"||capability==="couples_circle"?params.get("scopeId"):"account";
 if(!scope||(scope!=="account"&&!validUuid(scope)))return NextResponse.json({error:"Invalid scope"},{status:400});
 try{return NextResponse.json({environment:"test",capability,scopeId:scope,active:await hasTestEntitlement(user.id,capability,scope)},{headers:{"Cache-Control":"private, no-store"}});}
 catch{return NextResponse.json({error:"TEST access unavailable"},{status:503});}
}
