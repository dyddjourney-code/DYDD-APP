import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {assertRequestSandbox} from '@/lib/assessment-timing/requests';
import styles from './timing.module.css';
export default function AssessmentTimingLayout({children}:{children:ReactNode}){try{assertRequestSandbox();}catch{notFound();}return <div className={styles.shell}>{children}</div>;}
