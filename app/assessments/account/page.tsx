import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifiedGuestAccountUser } from '@/lib/public-assessments/guest-account';
import { getOwnedAssessmentSnapshots } from '@/lib/public-assessments/identity';
export const dynamic='force-dynamic';
export default async function AccountAssessmentReports() {
 const user=await verifiedGuestAccountUser().catch(()=>null);
 if(!user)redirect('/login?'+new URLSearchParams({next:'/assessments/account'}));
 const snapshots=await getOwnedAssessmentSnapshots(user,{includeGuest:true});
 return <main><h1>Your saved assessment reports</h1><p>Your connected guest reports and existing app results are kept together.</p>
 {snapshots.length ? <ul>{snapshots.map(snapshot=><li key={snapshot.id}><Link href={snapshot.owned_report_href || `/api/artifacts/${snapshot.id}/download`}>
 {snapshot.assessment_type==='designid'?'DesignID':snapshot.assessment_type==='designpd'?'DesignPD':snapshot.assessment_type.replaceAll('_',' ')} · {new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(snapshot.source_submitted_at||snapshot.created_at))}</Link> · {snapshot.source||'app'}</li>)}</ul> : <p>No reports are connected yet. Open your private assessment link to connect its results.</p>}
 <Link href="/assessments">Assessments</Link></main>;
}
