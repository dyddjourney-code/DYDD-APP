'use client';
import {useActionState,useId} from 'react';
import {requestReturningGuestRecovery} from './guest-recovery-actions';
import styles from './public-assessments.module.css';
import type {RecoveryProduct} from '@/lib/public-assessments/guest-recovery';
export function GuestRecoveryForm({product}:{product:RecoveryProduct}) {
 const [state,action,pending]=useActionState(requestReturningGuestRecovery,{message:''});
 const id=useId();
 return <form action={action} className={styles.waiverForm}>
  <input type="hidden" name="product" value={product}/>
  <label htmlFor={id}>Email used for your guest purchase</label>
  <input id={id} name="email" type="email" autoComplete="email" maxLength={254} required style={{display:'block',width:'100%',maxWidth:420,padding:'0.7rem',margin:'0.5rem 0'}}/>
  <button className={styles.primary} type="submit" disabled={pending}>{pending?'Requesting…':'Email my private recovery link'}</button>
  <p role="status" aria-live="polite">{state.message}</p>
 </form>;
}
