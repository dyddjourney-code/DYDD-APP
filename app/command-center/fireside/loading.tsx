import styles from './host.module.css';
export default function Loading() { return <main className={`command-center-shell ${styles.shell}`} aria-busy="true"><p className={styles.eyebrow}>Fireside / Host workspace</p><h1>Preparing your workspace</h1><div className={styles.skeleton} /><div className={styles.skeleton} /></main>; }
