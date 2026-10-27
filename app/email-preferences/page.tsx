import type {Metadata} from 'next';
import {EmailPreferences} from '@/components/email-preferences';
export const metadata:Metadata={title:'Email preferences',referrer:'no-referrer',robots:{index:false,follow:false}};
export default async function Preferences({searchParams}:{searchParams:Promise<{token?:string}>}){return <main><EmailPreferences token={(await searchParams).token}/></main>;}
