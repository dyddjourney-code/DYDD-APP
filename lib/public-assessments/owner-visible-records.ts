import 'server-only';
type OverviewRecord={snapshots:{source:string|null;provenance?:Record<string,unknown>}[]};
/** Legacy private test-group hiding must not conceal real public submissions
 * just because their typed contact email merges into that participant card.
 * Preserve hidden native test records; expose only the retained public results. */
export function visibleOwnerOverviewRecords<T extends OverviewRecord>(records:T[],excluded:(record:T)=>boolean):T[] {
 return records.flatMap(record=>{
  if(!excluded(record))return [record];
  const snapshots=record.snapshots.filter(s=>s.source==='public_guest'||s.provenance?.channel==='public_assessment');
  return snapshots.length?[{...record,snapshots}]:[];
 });
}
