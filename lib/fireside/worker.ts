import {check,db} from './server';
/** Called by the existing authenticated sandbox lifecycle scheduler. Never imports a mail provider. */
export async function runFiresidePreviewWorker(){if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox')return {skipped:true,previewOnly:true};const previewed=check(await db().rpc('fireside_preview_reminders'));return {previewOnly:true,previewed};}
