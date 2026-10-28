import {redirect} from 'next/navigation';
import {supportAdmin} from '@/lib/support/auth';
import {EmailActivity} from './email-activity';
export const dynamic='force-dynamic';
export const metadata={title:'Email activity | DYDD',robots:{index:false,follow:false}};
export default async function EmailAdmin(){if(!await supportAdmin())redirect('/login?next=%2Fadmin%2Femail');return <EmailActivity/>;}
