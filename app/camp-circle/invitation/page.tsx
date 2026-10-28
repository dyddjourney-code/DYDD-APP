import type {Metadata} from 'next';
import {CircleInvitation} from '@/components/circle-invitation';
export const metadata:Metadata={title:'Your Circle invitation',referrer:'no-referrer',robots:{index:false,follow:false}};
export default async function Invitation({searchParams}:{searchParams:Promise<{token?:string}>}){const p=await searchParams;return <main><CircleInvitation token={p.token||''}/></main>;}
