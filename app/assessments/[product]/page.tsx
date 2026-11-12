import { ReturningGuestRecovery } from '../returning-guest-recovery';
import AccountAssessmentAccess from './account-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
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
 return <AssessmentPublicShell focused>
  {message?<p role="status" className={styles.status}>{message}</p>:null}
  <section className={styles.detailGrid}>
   <div className={styles.story}><img className={styles.productLogo} src={p.logo} alt={p.name}/><p className={styles.eyebrow}>{p.eyebrow}</p><h1>{product==='designid'?'Discover your DesignID.':'Your design in everyday motion.'}</h1><p className={styles.lede}>{p.short}</p><p>No account or sign-in is needed.</p><ol><li>{product==='designid'?'Purchase your report.':'Start with your completed DesignID.'}</li><li>{product==='designid'?'Complete the 21-step assessment.':'Purchase your DesignPD report.'}</li><li>Download your PDF and receive a copy by email.</li></ol></div>
   <div className={styles.accessPanel}><p className={styles.eyebrow}>One-time report purchase</p><h2>{p.name} · $19.99 USD</h2>
    {product==='designid'?<><p>Purchase securely, complete the DesignID questionnaire, then download your report. Your email includes the PDF attachment and a private access link.</p>
     {paused?<p className={styles.status}>New purchases are temporarily paused while we finish verification. Existing private access links remain available.</p>:null}
     <form action={startGuestDesignId} className={styles.waiverForm}><label htmlFor="guest-name">Your name</label><input id="guest-name" name="name" required minLength={2} maxLength={120} autoComplete="name"/><label htmlFor="guest-email">Report email</label><input id="guest-email" name="email" type="email" required maxLength={254} autoComplete="email"/><p className={styles.helper}>Use an inbox you can access. No password or account will be created.</p><AssessmentSubmitButton disabled={paused} pendingLabel="Opening secure checkout…">Continue to checkout · $19.99</AssessmentSubmitButton></form></>
    :<><p>DesignPD is a separate $19.99 report derived from your exact completed DesignID. There is no additional questionnaire.</p>{paused?<p className={styles.helper}>New purchases are currently paused.</p>:null}</>}
    <ReturningGuestRecovery product={product}/>
    {product==='designpd'?<><p className={styles.helper}>New to DesignID? <a href="/assessments/designid?guest=1">Begin with DesignID first</a>.</p><p><a href="https://www.discoverdivine.design/designpd" target="_blank" rel="noopener noreferrer">Explore DesignPD</a></p></>:<p className={styles.helper}>DesignID retakes follow normal six-calendar-month timing. One report per purchase. Your saved report can be reopened without repurchasing.</p>}
   </div>
  </section>
 </AssessmentPublicShell>;
}
