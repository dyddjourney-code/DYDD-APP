'use client';
import s from './guest-access.module.css';
export default function GuestAccessError({reset}:{reset:()=>void}){return <main className={s.shell}><h1>DYDD Guest Pass</h1><div className={s.error} role="alert"><h2>Guest passes could not be loaded</h2><p>Your saved passes are unchanged. Try loading the list again.</p><button type="button" onClick={reset}>Try again</button></div></main>;}
