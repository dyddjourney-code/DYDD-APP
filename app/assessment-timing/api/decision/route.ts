import {assertRequestOrigin,requestIdentity,decideEarlyRetake} from '@/lib/assessment-timing/requests';
export async function POST(request:Request){
 try{assertRequestOrigin(request);const actor=await requestIdentity(true);const form=await request.formData();const id=String(form.get('id')||''),token=String(form.get('token')||'');await decideEarlyRetake(actor,id,token,String(form.get('decision')||''),String(form.get('reason')||''));const target=new URL('/assessment-timing/owner',request.url);target.searchParams.set('id',id);target.searchParams.set('token',token);target.searchParams.set('notice','Decision recorded. Notification status appears below.');return Response.redirect(target,303);}
 catch(error){return Response.json({error:error instanceof Error?error.message:'Decision unavailable.'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
