import s from './guest-access.module.css';
export default function GuestPassLoading(){return <main className={s.shell} aria-busy="true"><h1>DYDD Guest Pass</h1><div className={s.loading}>Loading your guest passes…<div className={s.skeleton}/><div className={s.skeleton}/></div></main>;}
