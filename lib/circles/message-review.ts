/** UI-only labels. Never use this title as an email subject or saved draft value. */
export function circleMessageReviewTitle(message:{message_key:string;meeting_index?:number},subject:string,finalSession:number):string{
 const keyed=message.message_key.match(/^(?:preparation|reminder|leader-digest)-(\d+)$/);
 const session=message.meeting_index || (keyed?Number(keyed[1]):message.message_key==='leader-action'?1:['circle-wrap','leader-wrap'].includes(message.message_key)?finalSession:0);
 return Number.isInteger(session)&&session>0?`Session ${session} · ${subject}`:subject;
}
