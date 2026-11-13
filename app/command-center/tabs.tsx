'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './tabs.module.css';
const views = [
  ['/command-center', 'Assessments & groups'],
  ['/command-center/accounts', 'Accounts'],
  ['/command-center/fireside', 'Fireside'],
] as const;
export default function CommandCenterTabs() {
  const pathname = usePathname();
  return <div className={styles.shell}>
    <p className={styles.label}>Command Center <span>Sandbox workspace · sandbox data only</span></p>
    <nav className={styles.tabs} aria-label="Command Center views">
      {views.map(([href, label]) => <Link key={href} href={href} prefetch={false}
        aria-current={(href === '/command-center' ? pathname === href : pathname.startsWith(href)) ? 'page' : undefined}>{label}</Link>)}
    </nav>
  </div>;
}
