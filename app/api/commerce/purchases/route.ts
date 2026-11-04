import {NextResponse} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {assertTestBilling,testBillingEnabled} from '@/lib/commerce/test-billing-config';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
 if(!testBillingEnabled())return reply({error:'Not found'},404);
 const user=(await(await createSupabaseServerClient()).auth.getUser()).data.user;
 if(!user?.email_confirmed_at)return reply({error:'Sign in with a verified account.'},401);
 try{
  assertTestBilling();
  // Identity comes only from validated authentication; no caller-selected account or scope.
  const {data,error}=await createSupabaseAdminClient().from('dydd_test_billing_orders')
   .select('id,capability,scope_id,status,created_at,subscription_id').eq('user_id',user.id)
   .in('status',['paid','revoked']).order('created_at',{ascending:false});
  if(error)throw error;
  const legacy=await createSupabaseAdminClient().from('fruitlife_360_entitlements')
   .select('id,fruitlife_session_id,status,purchased_at').eq('user_id',user.id).not('stripe_checkout_session_id','is',null).order('purchased_at',{ascending:false});
  if(legacy.error)throw legacy.error;
  const purchases=[...(data||[]).map(row=>({id:row.id,capability:row.capability,scopeId:row.scope_id,status:row.status,purchasedAt:row.created_at,recurring:Boolean(row.subscription_id)})),
   ...(legacy.data||[]).map(row=>({id:row.id,capability:'fruitlife_360',scopeId:row.fruitlife_session_id,status:row.status,purchasedAt:row.purchased_at,recurring:false}))]
   .sort((a,b)=>Date.parse(b.purchasedAt)-Date.parse(a.purchasedAt));
  return reply({purchases});
 }catch{return reply({error:'Your purchase records could not be loaded. Your account and saved records are preserved.'},503);}
}
