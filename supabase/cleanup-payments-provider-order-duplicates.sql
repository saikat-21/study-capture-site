-- Safe cleanup for duplicate Razorpay order IDs before adding the
-- payments_provider_order_conflict_idx unique index.
--
-- This script does not DROP, TRUNCATE, or DELETE data. It preserves every row
-- and moves non-canonical duplicate provider_order_id values to archived,
-- unique values while recording the original order ID in raw_event.

-- 1. Preview duplicates. If this returns no rows, skip to step 3.
select
  provider_order_id,
  count(*) as duplicate_count,
  array_agg(id order by paid_at desc nulls last, updated_at desc, created_at desc) as payment_ids
from public.payments
where provider_order_id is not null
group by provider_order_id
having count(*) > 1
order by duplicate_count desc, provider_order_id;

-- 2. Preserve all rows, but keep only one canonical row per provider_order_id.
-- Canonical preference: paid rows, rows linked to a license, newest paid_at,
-- newest updated_at, newest created_at.
with ranked as (
  select
    id,
    provider_order_id,
    first_value(id) over (
      partition by provider_order_id
      order by
        (status = 'paid') desc,
        (license_id is not null) desc,
        paid_at desc nulls last,
        updated_at desc,
        created_at desc,
        id desc
    ) as canonical_payment_id,
    row_number() over (
      partition by provider_order_id
      order by
        (status = 'paid') desc,
        (license_id is not null) desc,
        paid_at desc nulls last,
        updated_at desc,
        created_at desc,
        id desc
    ) as row_rank
  from public.payments
  where provider_order_id is not null
),
archived_duplicates as (
  update public.payments p
  set
    provider_order_id = concat(p.provider_order_id, '__duplicate__', left(p.id::text, 8)),
    raw_event = coalesce(p.raw_event, '{}'::jsonb) || jsonb_build_object(
      'provider_order_id_dedupe',
      jsonb_build_object(
        'original_provider_order_id', r.provider_order_id,
        'canonical_payment_id', r.canonical_payment_id,
        'archived_payment_id', p.id,
        'archived_at', now()
      )
    ),
    updated_at = now()
  from ranked r
  where p.id = r.id
    and r.row_rank > 1
  returning
    p.id,
    r.provider_order_id as original_provider_order_id,
    p.provider_order_id as archived_provider_order_id,
    r.canonical_payment_id
)
select * from archived_duplicates;

-- 3. Verify no duplicate non-null provider_order_id values remain.
select
  provider_order_id,
  count(*) as duplicate_count
from public.payments
where provider_order_id is not null
group by provider_order_id
having count(*) > 1;

-- 4. Add the non-partial unique index required by Supabase/PostgREST upsert.
create unique index if not exists payments_provider_order_conflict_idx
  on public.payments (provider_order_id);
