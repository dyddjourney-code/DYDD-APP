import type { AccountPurchaseRecord } from '@/lib/basecamp/account-purchases';
export function BaseCampPurchaseHistory({ records, unavailable }: { records: AccountPurchaseRecord[]; unavailable: boolean }) {
 return <div className="account-purchases"><h3>Purchases &amp; history</h3>
  {unavailable ? <p role="status">Your purchase records could not be loaded. Refresh to try again; your saved access and history are unchanged.</p> : records.length ? <ul className="account-purchase-history">{records.map(row => <li key={row.id}>
   <strong>{row.product === 'designid' ? 'DesignID' : row.product === 'designpd' ? 'DesignPD' : row.product} report</strong>
   <span><time dateTime={row.recordedAt}>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(row.recordedAt))}</time> · {row.status === 'waived' ? 'Included access' : row.status === 'refunded' ? 'Refunded' : 'Recorded purchase'} · One-time</span>
   <small>Original report rights and purchase scope retained.</small>
  </li>)}</ul> : <p>No completed report purchases are linked to this account yet.</p>}
 </div>;
}
