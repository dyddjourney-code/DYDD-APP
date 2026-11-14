import { notFound } from 'next/navigation';
import { isPrivateOwnerConsole } from '@/lib/private-owner';
import FiresideHost from './host';
export const dynamic='force-dynamic';
export const metadata={title:'Fireside Host | Owner Command Center',robots:{index:false,follow:false}};
export default function Page(){if(!isPrivateOwnerConsole())notFound();return <><div role="note" style={{padding:'12px 24px',background:'#f0d99e',color:'#3f381d'}}>Fireside sandbox · Separate test data. Your existing private owner access is in use. Email delivery and payments remain off.</div><FiresideHost/></>;}
