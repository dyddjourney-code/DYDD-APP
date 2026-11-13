'use client';
import s from './host.module.css';
export default function FiresideHostError({reset}:{reset:()=>void}) { return <main className={`command-center-shell ${s.shell}`}><p className={s.eyebrow}>Fireside / Host workspace</p><h1>The host workspace could not load.</h1><p className={s.error} role="alert">Your saved gatherings have not been changed. Try again to reload the workspace.</p><div className={s.actions}><button className={s.primary} onClick={reset}>Try again</button><a className={s.button} href="/command-center">Command Center</a></div></main>; }
