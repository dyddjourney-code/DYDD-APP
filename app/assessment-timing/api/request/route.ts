import {assertRequestOrigin,requestIdentity,requestEarlyRetake,type RequestAssessmentType} from '@/lib/assessment-timing/requests';
export async function POST(request:Request){
 try{assertRequestOrigin(request);const user=await requestIdentity();const form=await request.formData();await requestEarlyRetake(user,String(form.get('type')) as RequestAssessmentType,String(form.get('happened')||''),String(form.get('understood')||''));return Response.redirect(new URL('/assessment-timing/request?notice='+encodeURIComponent('Request saved. Notification status is shown below.'),request.url),303);}
 catch(error){return Response.redirect(new URL('/assessment-timing/request?notice='+encodeURIComponent(error instanceof Error?error.message:'Request unavailable.'),request.url),303);}
}
