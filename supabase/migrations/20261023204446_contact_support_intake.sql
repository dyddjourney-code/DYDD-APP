-- Contact support only. Apply to sandbox first. No mail, forwarding or telemetry.
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  email text not null check (length(email) between 3 and 254),
  subject text not null check (length(subject) between 3 and 160),
  message text not null check (length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index support_requests_queue_idx on public.support_requests(status, created_at desc, id desc);
alter table public.support_requests enable row level security;
revoke all on public.support_requests from public, anon, authenticated;
grant select, insert, update, delete on public.support_requests to service_role;

create table public.support_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0)
);
alter table public.support_rate_limits enable row level security;
revoke all on public.support_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.support_rate_limits to service_role;

-- Server-only invoker: atomic UPSERT row locks serialize concurrent requests.
-- Fixed hourly buckets retain hashes only; old windows are removed on submission.
create function public.submit_support_request(p_name text, p_email text, p_subject text, p_message text, p_email_key text, p_network_key text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  email_attempts integer;
  network_attempts integer;
  request_id uuid;
  current_window timestamptz := date_trunc('hour', now());
begin
  if p_email_key !~ '^[0-9a-f]{64}$' or p_network_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid support limiter key';
  end if;
  delete from public.support_rate_limits where window_start < current_window - interval '2 hours';
  insert into public.support_rate_limits as limits(key, window_start, attempts)
    values ('email:' || p_email_key, current_window, 1)
    on conflict (key) do update set
      attempts = case when limits.window_start = current_window then limits.attempts + 1 else 1 end,
      window_start = current_window
    returning attempts into email_attempts;
  insert into public.support_rate_limits as limits(key, window_start, attempts)
    values ('network:' || p_network_key, current_window, 1)
    on conflict (key) do update set
      attempts = case when limits.window_start = current_window then limits.attempts + 1 else 1 end,
      window_start = current_window
    returning attempts into network_attempts;
  if email_attempts > 3 or network_attempts > 15 then return null; end if;
  insert into public.support_requests(name, email, subject, message)
    values (p_name, p_email, p_subject, p_message) returning id into request_id;
  return request_id;
end;
$$;
revoke all on function public.submit_support_request(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_support_request(text,text,text,text,text,text) to service_role;
