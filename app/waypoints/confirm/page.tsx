import {WaypointConfirmation} from '@/components/waypoint-confirmation';
export const metadata={title:'Confirm Waypoints | DYDD',referrer:'no-referrer' as const,robots:{index:false,follow:false}};
export default async function Confirm({searchParams}:{searchParams:Promise<{token?:string}>}){return <WaypointConfirmation token={(await searchParams).token||''}/>;}
