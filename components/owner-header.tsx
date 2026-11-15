import Link from "next/link";
import { ownerDestinations } from "@/lib/owner-navigation";
import styles from "./owner-header.module.css";
export function OwnerHeader() {
  return <header className={styles.header}>
    <Link href="/command-center/home" aria-label="DYDD owner Home" className={styles.brand}><img src="/brand/dydd-logo.webp" alt="Discover Your Divine Design" width="160" /></Link>
    <nav aria-label="Owner home" className={styles.primary}><Link href="/command-center/home">Home</Link><details className={styles.menu}><summary>All destinations</summary><nav aria-label="Owner Command Center" className={styles.destinations}>{ownerDestinations.map(item => item.href.startsWith("https:") ? <a key={item.href} href={item.href} referrerPolicy="no-referrer">{item.title}</a> : <Link key={item.href} href={item.href}>{item.title}</Link>)}</nav></details></nav>
    <p className={styles.note}>Private owner <span>Original-school live data · Fireside host tools use isolated sandbox data</span></p>
  </header>;
}
