create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email citext not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email citext not null unique,
  license_ref text unique,
  state text not null default 'free' check (
    state in ('free', 'paid_lifetime', 'refunded', 'chargeback', 'banned_abuse')
  ),
  max_devices integer not null default 3 check (max_devices > 0),
  activated_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  license_id uuid references public.licenses(id) on delete set null,
  email citext not null,
  plan text not null default 'pro_lifetime',
  status text not null default 'active' check (
    status in ('active', 'free', 'refunded', 'chargeback', 'banned_abuse', 'cancelled')
  ),
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  amount integer not null default 79900,
  currency text not null default 'INR',
  lifetime_access boolean not null default true,
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, plan)
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  device_id_hash text not null,
  browser_name text,
  os text,
  extension_version text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  deactivated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists devices_one_active_device_idx
  on public.devices (license_id, device_id_hash)
  where deactivated_at is null;

create index if not exists devices_license_active_idx
  on public.devices (license_id, last_seen_at desc)
  where deactivated_at is null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  license_id uuid references public.licenses(id) on delete set null,
  email citext not null,
  provider text not null default 'placeholder',
  provider_order_id text,
  provider_checkout_id text,
  provider_payment_id text,
  provider_event_id text,
  amount integer not null default 79900,
  currency text not null default 'INR',
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'failed', 'refunded', 'chargeback')
  ),
  source text,
  reason text,
  receipt text,
  paid_at timestamptz,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.licenses add column if not exists license_ref text;
create unique index if not exists licenses_license_ref_idx
  on public.licenses (license_ref)
  where license_ref is not null;

alter table public.subscriptions add column if not exists user_id uuid references public.users(id) on delete set null;
alter table public.subscriptions add column if not exists license_id uuid references public.licenses(id) on delete set null;
alter table public.subscriptions add column if not exists provider_order_id text;
alter table public.subscriptions add column if not exists provider_payment_id text;
alter table public.subscriptions add column if not exists lifetime_access boolean not null default true;
alter table public.subscriptions add column if not exists ended_at timestamptz;

create index if not exists subscriptions_email_idx on public.subscriptions (email);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_license_idx on public.subscriptions (license_id);
create index if not exists subscriptions_provider_payment_idx
  on public.subscriptions (provider, provider_payment_id);

insert into public.subscriptions (
  user_id,
  license_id,
  email,
  plan,
  status,
  provider,
  amount,
  currency,
  lifetime_access,
  started_at,
  ended_at,
  metadata
)
select
  l.user_id,
  l.id,
  l.email,
  'pro_lifetime',
  case
    when l.state = 'paid_lifetime' then 'active'
    when l.state in ('refunded', 'chargeback', 'banned_abuse') then l.state
    else 'free'
  end,
  'razorpay',
  79900,
  'INR',
  true,
  l.activated_at,
  case when l.state = 'paid_lifetime' then null else now() end,
  jsonb_build_object('licenseRef', l.license_ref, 'backfilled', true)
from public.licenses l
where l.license_ref is not null
on conflict (email, plan) do update set
  user_id = excluded.user_id,
  license_id = excluded.license_id,
  status = excluded.status,
  lifetime_access = excluded.lifetime_access,
  started_at = coalesce(public.subscriptions.started_at, excluded.started_at),
  updated_at = now();

alter table public.payments add column if not exists provider_order_id text;
alter table public.payments add column if not exists user_id uuid references public.users(id) on delete set null;
alter table public.payments add column if not exists provider_event_id text;
alter table public.payments add column if not exists source text;
alter table public.payments add column if not exists reason text;
alter table public.payments add column if not exists receipt text;
alter table public.payments add column if not exists paid_at timestamptz;

create index if not exists payments_email_idx on public.payments (email);
create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_provider_payment_idx on public.payments (provider, provider_payment_id);
create unique index if not exists payments_provider_order_idx
  on public.payments (provider_order_id)
  where provider_order_id is not null;

create table if not exists public.webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_id text not null,
  event_type text not null,
  provider_order_id text,
  provider_payment_id text,
  raw_event jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists public.auth_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  email citext,
  ip_hash text,
  success boolean not null default false,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists auth_events_rate_email_idx
  on public.auth_events (event_type, email, created_at desc);

create index if not exists auth_events_rate_ip_idx
  on public.auth_events (event_type, ip_hash, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists licenses_set_updated_at on public.licenses;
create trigger licenses_set_updated_at
before update on public.licenses
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
before update on public.devices
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.licenses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.devices enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.auth_events enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
to authenticated
using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

drop policy if exists "licenses_select_own" on public.licenses;
create policy "licenses_select_own"
on public.licenses
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id in (
      select id from public.users where auth_user_id = (select auth.uid())
    )
    or email = ((select auth.jwt()) ->> 'email')::citext
  )
);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id in (
      select id from public.users where auth_user_id = (select auth.uid())
    )
    or email = ((select auth.jwt()) ->> 'email')::citext
  )
);

drop policy if exists "devices_select_own" on public.devices;
create policy "devices_select_own"
on public.devices
for select
to authenticated
using (
  (select auth.uid()) is not null
  and license_id in (
    select id
    from public.licenses
    where
      user_id in (
        select id from public.users where auth_user_id = (select auth.uid())
      )
      or email = ((select auth.jwt()) ->> 'email')::citext
  )
);

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
on public.payments
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id in (
      select id from public.users where auth_user_id = (select auth.uid())
    )
    or email = ((select auth.jwt()) ->> 'email')::citext
  )
);

-- webhook_events and auth_events intentionally have no anon/authenticated policies.
-- Website API routes use SUPABASE_SERVICE_ROLE_KEY and perform ownership checks server-side.

-- Razorpay payment webhooks should update public.payments to paid and upsert
-- public.licenses as paid_lifetime with a stable SC-PRO-YYYY-XXXXXX reference.
