import {assertRequestOrigin,requestIdentity,loadOwnRequests,flushRetakeMail,loadOwnerDecision} from '@/lib/assessment-timing/requests';
import {isDyddAdminEmail} from '@/lib/admin-access';
export async function POST(request:Request){
 try{
  assertRequestOrigin(request);const user=await requestIdentity();const form=await request.formData(),id=String(form.get('id')||''),token=String(form.get('token')||'');
  const owner=isDyddAdminEmail(user.email)&&user.email.toLowerCase()==='dyddjourney@gmail.com';
  if(owner&&token) await loadOwnerDecision(id,token);
  else { const own=(await loadOwnRequests(user.id)).find(r=>r.id===id);if(!own||own.status==='expired')throw Error('Request not available.'); }
  await flushRetakeMail(id);
  if(owner&&token){const target=new URL('/assessment-timing/owner',request.url);target.searchParams.set('id',id);target.searchParams.set('token',token);target.searchParams.set('notice','Saved notification retry finished.');return Response.redirect(target,303);}
  return Response.redirect(new URL('/assessment-timing/request?notice='+encodeURIComponent('Saved notification retry finished. Check status below.'),request.url),303);
 }catch(error){return Response.json({error:error instanceof Error?error.message:'Retry unavailable.'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
