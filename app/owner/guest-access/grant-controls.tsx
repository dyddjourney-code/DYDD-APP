'use client';
import {useActionState,useState} from 'react';
import {sendGuestAccessInvitation} from './actions';
export function CopyGuestPassLink({link}:{link:string}) {
 const [status,setStatus]=useState('Copy link');
 return <><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(link);setStatus('Copied');}catch{setStatus('Copy unavailable — use Open link');}}}>{status}</button> <a href={link} target="_blank" rel="noreferrer">Open link</a></>;
}
export function GuestInvitationControl({grantId,requestId,hasInvitation}:{grantId:string;requestId:string;hasInvitation:boolean}) {
 const [state,action,pending]=useActionState(sendGuestAccessInvitation,{message:''});
 return <form action={action}><input type="hidden" name="grant_id" value={grantId}/><input type="hidden" name="request_id" value={requestId}/><button disabled={pending}>{pending?'Requesting email…':hasInvitation?'Resend Email':'Send Email'}</button>{state.message?<p role="status">{state.message}</p>:null}</form>;
}
