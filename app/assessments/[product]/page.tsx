import AccountAssessmentAccess from './account-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AssessmentPublicShell, publicAssessmentProducts } from '../public-assessment-ui';
import { startGuestDesignId } from '../guest-actions';
import { AssessmentSubmitButton } from '../submit-button';
import styles from '../public-assessments.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Standalone assessments | DYDD',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function PublicProduct({params,searchParams}:{params:Promise<{product:string}>;searchParams:Promise<{message?:string;checkout?:string;sourceId?:string;guest?:string}>}) {
 const {product}=await params,query=await searchParams;
 const {message}=query;
 if(product==='spiritual-gifts')redirect('/spiritual-gifts');
 if(product!=='designid'&&product!=='designpd')notFound();
 // Existing signed-in app customers retain their exact saved reports, waivers, rights and returns.
 // Anonymous purchases NEVER enter this lane; no guest email can select account ownership.
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(user&&query.guest!=='1')return <AccountAssessmentAccess params={params} searchParams={searchParams}/>;
 const p=publicAssessmentProducts[product];
 const paused=process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED!=='true';
 return <AssessmentPublicShell>
  <p className={styles.breadcrumb}><Link href="/assessments">Assessments</Link> / {p.name}</p>
  {message?<p role="status" className={styles.status}>{message}</p>:null}
  <section className={styles.detailGrid}>
   <div className={styles.story}><img className={styles.productLogo} src={p.logo} alt={p.name}/><p className={styles.eyebrow}>{p.eyebrow}</p><h1>{p.heading}</h1><p className={styles.lede}>{p.description}</p><p>No account, app signup, or school membership is needed.</p><div className={styles.heroImage}><img src={p.image} alt=""/></div></div>
   <div className={styles.accessPanel}><p className={styles.eyebrow}>One-time report purchase</p><h2>{p.name} · $19.99 USD</h2>
    {product==='designid'?<><p>Purchase securely, complete the DesignID questionnaire, then download your report. We will also email your private report link.</p>
     {paused?<p className={styles.status}>New purchases are temporarily paused while we finish verification. Existing private recovery links remain available.</p>:null}
     <form action={startGuestDesignId} className={styles.waiverForm}><label htmlFor="guest-name">Your name</label><input id="guest-name" name="name" required minLength={2} maxLength={120} autoComplete="name"/><label htmlFor="guest-email">Report email</label><input id="guest-email" name="email" type="email" required maxLength={254} autoComplete="email"/><p className={styles.helper}>Use an inbox you can access. No password or account will be created.</p><AssessmentSubmitButton disabled={paused} pendingLabel="Opening secure checkout…">Continue to checkout · $19.99</AssessmentSubmitButton></form></>
    :<><p>DesignPD is a separate $19.99 report derived from your exact completed DesignID. There is no additional questionnaire.</p><p>Already completed guest DesignID? Open the private recovery link from your report email and select DesignPD there. An email address alone cannot retrieve your results.</p><Link href="/assessments/designid?guest=1">Begin with DesignID</Link>{paused?<p className={styles.helper}>New purchases are currently paused.</p>:null}</>}
    <p className={styles.helper}>DesignID retakes follow normal six-calendar-month timing. One report per purchase. Your saved report can be reopened without repurchasing. Assessment reports do not grant courses or app access.</p>
   </div>
  </section>
 </AssessmentPublicShell>;
}
