create table if not exists public.availability_blackouts (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint availability_blackouts_time_check check (ends_at > starts_at)
);

create index if not exists idx_availability_blackouts_experience_id
on public.availability_blackouts (experience_id);

create index if not exists idx_availability_blackouts_starts_at
on public.availability_blackouts (starts_at);

alter table public.availability_blackouts enable row level security;

drop policy if exists "public read availability_blackouts" on public.availability_blackouts;
create policy "public read availability_blackouts"
on public.availability_blackouts
for select
using (true);

drop policy if exists "vendor manage own availability_blackouts" on public.availability_blackouts;
create policy "vendor manage own availability_blackouts"
on public.availability_blackouts
for all
to authenticated
using (
  exists (
    select 1
    from public.experiences e
    join public.vendors v on v.id = e.vendor_id
    where e.id = availability_blackouts.experience_id
      and v.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.experiences e
    join public.vendors v on v.id = e.vendor_id
    where e.id = availability_blackouts.experience_id
      and v.owner_user_id = auth.uid()
  )
);

drop policy if exists "admin manage all availability_blackouts" on public.availability_blackouts;
create policy "admin manage all availability_blackouts"
on public.availability_blackouts
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);