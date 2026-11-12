'use client';
import {useActionState,useState} from 'react';
import {sendGuestAccessInvitation,revokeGuestAccessGrant} from './actions';
import s from './guest-access.module.css';
export function CopyGuestPassLink({link}:{link:string}) {
 const [status,setStatus]=useState('Copy Link');
 return <div className={s.actions}><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(link);setStatus('Copied');}catch{setStatus('Select link in Details');}}}>{status}</button><a className={s.button} href={link} target="_blank" rel="noreferrer">Open link ↗</a></div>;
}
export function GuestInvitationControl({grantId,requestId,hasInvitation}:{grantId:string;requestId:string;hasInvitation:boolean}) {
 const [state,action,pending]=useActionState(sendGuestAccessInvitation,{message:''});
 return <form action={action} aria-busy={pending}><input type="hidden" name="grant_id" value={grantId}/><input type="hidden" name="request_id" value={requestId}/><button className={s.primary} disabled={pending}>{pending?'Sending…':hasInvitation?'Resend Email':'Send Email'}</button>{state.message?<p className={s.feedback} role="status">{state.message}</p>:null}</form>;
}
export function RevokeGuestControl({grantId}:{grantId:string}) {
 const [state,action,pending]=useActionState(async(_state:{message:string},form:FormData)=>{try{await revokeGuestAccessGrant(form);return {message:'Access revoked.'};}catch(error){return {message:error instanceof Error?error.message:'Revocation failed. Please retry.'};}},{message:''});
 return <form action={action}><input type="hidden" name="grant_id" value={grantId}/><p className={s.secondary}>Revoking disables this link and the access and recovery it granted. Saved scores are retained.</p><button className={s.danger} disabled={pending}>{pending?'Revoking…':'Revoke access'}</button>{state.message?<p className={s.feedback} role="status">{state.message}</p>:null}</form>;
}
