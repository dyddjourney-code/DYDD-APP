'use client';
import {useActionState,useState} from 'react';
import {uploadBetaChecklist,sendVolunteerWelcome,revokeVolunteerInvitation} from './volunteer-actions';
import s from './guest-access.module.css';
export function CopyVolunteerInvitation({code,link}:{code:string;link:string}){
 const [message,setMessage]=useState('Copy signup details');
 return <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(`DYDD Volunteer Beta Tester\nCreate your account: ${link}\nYour unique lifetime access code: ${code}\nUse your invited email, verify it, then redeem the code in Base Camp.`);setMessage('Copied');}catch{setMessage('Select the code and link below');}}}>{message}</button>;
}
export function ChecklistControl({filename,updatedAt}:{filename?:string;updatedAt?:string}){
 const [state,action,pending]=useActionState(uploadBetaChecklist,{message:''});
 return <details className={s.help}><summary>Beta tester checklist · {filename?'Attached':'Awaiting John’s document'}</summary><p>{filename?`Current attachment: ${filename}`:'No checklist is attached. Welcome emails stay disabled until John’s document is uploaded.'}{updatedAt?' · Updated '+new Date(updatedAt).toLocaleDateString('en-US'):''}</p><form action={action} className={s.form}><label>John’s checklist · PDF or DOCX, up to 2 MB<input name="checklist" type="file" accept=".pdf,.docx" required/></label><button className={s.primary} disabled={pending}>{pending?'Saving…':filename?'Replace checklist':'Attach checklist'}</button>{state.message?<p role="status">{state.message}</p>:null}</form><p className={s.secondary}>Stored privately. Uploading does not send invitations. Replacing it stops pending welcomes with the older attachment; review before sending a new welcome.</p></details>;
}
export function VolunteerWelcomeControl({id,requestId,canSend,hasInvitation}:{id:string;requestId:string;canSend:boolean;hasInvitation:boolean}){
 const [state,action,pending]=useActionState(sendVolunteerWelcome,{message:''});
 return <form action={action}><input type="hidden" name="code_id" value={id}/><input type="hidden" name="request_id" value={requestId}/><button className={s.primary} disabled={pending||!canSend}>{pending?'Requesting welcome…':hasInvitation?'Resend welcome + checklist':'Send welcome + checklist'}</button>{!canSend?<p className={s.secondary}>Attach the checklist to enable welcome emails.</p>:null}{state.message?<p className={s.feedback} role="status">{state.message}</p>:null}</form>;
}
export function RevokeVolunteerControl({id}:{id:string}){
 const [state,action,pending]=useActionState(revokeVolunteerInvitation,{message:''});
 return <form action={action}><input type="hidden" name="code_id" value={id}/><button className={s.danger} disabled={pending}>{pending?'Revoking…':'Revoke unused code'}</button>{state.message?<p role="status">{state.message}</p>:null}</form>;
}
