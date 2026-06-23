-- Community Safety — join requests schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query) on a
-- free project, then paste the project URL + anon key into your .env file.

create table if not exists public.join_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  -- Where the user was standing when they tapped "Request to Join".
  latitude     double precision not null,
  longitude    double precision not null,

  -- The zone their coordinates fell inside, or null when no zone matched.
  zone_id      text,
  zone_name    text,

  -- Auto-approved when inside a known zone, otherwise queued for a human.
  status       text not null check (status in ('approved', 'pending_review'))
);

-- Speeds up the moderation queue ("show me everything pending, newest first").
create index if not exists join_requests_status_created_at_idx
  on public.join_requests (status, created_at desc);

-- Row level security: the mobile app uses the public (anon) key, so we allow
-- inserts but grant NO select/update/delete. Reading and moderating happen
-- through the dashboard or a service-role backend, never the public key. The
-- app inserts without `.select()`, so no read-back is required.
--
-- The policy targets `public` (all roles) on purpose: Supabase's newer
-- publishable keys may resolve to `anon` or `authenticated`, and we want either
-- to be able to submit. RLS still blocks every read.
alter table public.join_requests enable row level security;

drop policy if exists "anon can submit join requests" on public.join_requests;
drop policy if exists "anyone can submit join requests" on public.join_requests;
create policy "anyone can submit join requests"
  on public.join_requests
  for insert
  to public
  with check (true);

-- RLS gates which rows can be written, but the role still needs the table-level
-- INSERT privilege for the request to reach the policy at all.
grant insert on public.join_requests to anon, authenticated;
