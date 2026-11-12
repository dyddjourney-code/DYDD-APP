import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { scoreDesignId, parseDesignIdAllocationAnswers, designIdScorePayload, designIdScoringVersion } from '@/lib/designid/engine';
import { parseMapsConfirmation, scoreMapsConfirmation, mapsConfirmationItems, mapsConfirmationBuckets } from '@/lib/designid/maps-confirmation';
import { applyDesignIdPresentation, designIdResearch } from '@/lib/designid/research';
import { designIdQuestionBank, designIdQuestionBlocks } from '@/lib/designid/intake';
import { buildDesignIdReportPayload, designIdSnapshotSections } from '@/lib/designid/report';
import { scoreDesignPd, designPdScoringVersion } from '@/lib/designpd/engine';
import { buildDesignPdReportPayload, designPdSnapshotSections, designPdContentVersion, designPdTemplateId } from '@/lib/designpd/report';
import { guestRecords, guestSourceSnapshot, ownedGuestResult, paidGuestOrder, type GuestSession } from './guest';

export function scoreGuestDesignId(form:FormData,name:string,email:string) {
 let result=scoreDesignId(parseDesignIdAllocationAnswers(form));
 result.mapsConfirmation=scoreMapsConfirmation(parseMapsConfirmation(form),result);
 const research=designIdResearch(result,result.mapsConfirmation);
 result=applyDesignIdPresentation(result,research);
 const sections=designIdSnapshotSections(result);
 return {answers:result.answers,blockTotals:Object.fromEntries(designIdQuestionBlocks.map(b=>[b.block,5])),
  mapsConfirmation:result.mapsConfirmation,research,instrument:{questions:designIdQuestionBank,sortItems:mapsConfirmationItems,sortBuckets:mapsConfirmationBuckets},
  reportPayload:buildDesignIdReportPayload({participantName:name,participantEmail:email,result}),reportPayloadFormat:'template-v1',
  profileLanguage:sections.profileLanguage,summary:sections.summary,tieSummary:result.tieSummary,rankOrder:result.rankOrder,
  questionVersion:'designid-approved-edits-2026-10-15',scoringVersion:designIdScoringVersion,scores:designIdScorePayload(result),channel:'public_guest'};
}
export async function saveGuestResult(session:GuestSession,orderId:string,form?:FormData) {
 const order=await paidGuestOrder(session.id,orderId),records=await guestRecords(session.id);
 const existing=records.results.find(r=>r.order_id===order.id);
 if(existing)return existing.id; // exact original input/result survives retries, never rescored
 let scores:Record<string,unknown>;
 if(order.product==='designid'){
  if(!form)throw Error('Complete the DesignID questionnaire first.');
  scores=scoreGuestDesignId(form,session.participant_name,session.participant_email);
 }else{
  const source=await ownedGuestResult(session.id,order.source_result_id||'');
  const snapshot=guestSourceSnapshot(source),result=scoreDesignPd(snapshot);
  const payload=buildDesignPdReportPayload({designIdSnapshot:snapshot,participantName:session.participant_name,participantEmail:session.participant_email,result});
  const sections=designPdSnapshotSections(result,payload);
  scores={axisScores:result.axisScores,axisTendencies:result.axisTendencies,movement:result.movement,ratings:result.ratings,
   designIdSnapshotId:source.id,reportPayload:payload,reportPayloadFormat:'template-v1',reportTemplateId:designPdTemplateId,
   contentVersion:designPdContentVersion,questionVersion:'designpd-derived-from-designid-v1',scoringVersion:designPdScoringVersion,
   profileLanguage:sections.profileLanguage,summary:sections.summary,channel:'public_guest'};
 }
 const saved=await createSupabaseAdminClient().rpc('dydd_guest_save_result',{p_session_id:session.id,p_order_id:order.id,p_scores:scores});
 if(saved.error||!saved.data)throw Error('Your purchase is preserved, but saving needs recovery. Retry this same session; do not repurchase.');
 return String(saved.data);
}
