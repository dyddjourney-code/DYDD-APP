-- Parent-run verification after additive migrations. READ ONLY; no email, report or claim mutations.
begin read only;
-- Every saved guest result should be visible to the owner regardless of claimed state.
select r.product,o.payment_provider,o.status,count(*) as saved_results,
 count(l.session_id) as results_linked_to_verified_accounts
from public.dydd_guest_results r
join public.dydd_guest_orders o on o.id=r.order_id
left join public.dydd_guest_account_links l on l.session_id=r.session_id
group by 1,2,3 order by 1,2,3;
-- Must return zero: a link without its atomic audit, or an audit with another owner.
select l.session_id from public.dydd_guest_account_links l
left join public.dydd_guest_account_link_audit a on a.session_id=l.session_id and a.user_id=l.user_id
where a.id is null;
select a.session_id from public.dydd_guest_account_link_audit a
join public.dydd_guest_account_links l on l.session_id=a.session_id where l.user_id<>a.user_id;
-- Existing public Gifts are already saved as snapshots; query overlay preserves these.
select coalesce(s.metadata->>'channel','unknown') as channel,s.signup_source,
 count(*) as sessions,count(a.id) as existing_snapshots
from public.spiritual_gifts_sessions s
left join public.assessment_snapshots a on a.id=s.result_snapshot_id
group by 1,2 order by 1,2;
-- Saved response fallback is rendered read-only from derived_scores, never rescored.
select count(*) as saved_gifts_responses_missing_linked_snapshot
from public.spiritual_gifts_responses r join public.spiritual_gifts_sessions s on s.id=r.session_id
left join public.assessment_snapshots a on a.id=s.result_snapshot_id
where a.id is null;
-- Browser roles must not have table reads or RPC execution. All values MUST be false.
select role_name,
 has_table_privilege(role_name,'public.dydd_guest_account_links','SELECT') as can_read_links,
 has_table_privilege(role_name,'public.dydd_guest_account_link_audit','SELECT') as can_read_audit,
 has_function_privilege(role_name,'public.dydd_guest_link_verified_account(uuid,uuid,text)','EXECUTE') as can_claim_directly
from (values('anon'),('authenticated')) r(role_name);
rollback;
