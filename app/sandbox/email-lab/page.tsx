import {notFound} from 'next/navigation';
import {EmailLab} from './email-lab';
export const metadata={title:'Sandbox email walkthrough | DYDD',robots:{index:false,follow:false}};
export default function SandboxEmailLab(){if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox')notFound();return <EmailLab/>;}
