alter table public.availability_slots
add column if not exists experience_id uuid references public.experiences(id) on delete cascade;

alter table public.availability_slots
add column if not exists start_at timestamptz;

alter table public.availability_slots
add column if not exists end_at timestamptz;

alter table public.availability_slots
add column if not exists capacity int;

alter table public.availability_slots
add column if not exists spots_remaining int;

alter table public.availability_slots
add column if not exists status text default 'open';

alter table public.availability_slots
add column if not exists created_at timestamptz not null default now();

alter table public.availability_slots
add column if not exists updated_at timestamptz not null default now();

update public.availability_slots
set
  capacity = coalesce(capacity, 1),
  spots_remaining = coalesce(spots_remaining, 1),
  status = coalesce(status, 'open'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  capacity is null
  or spots_remaining is null
  or status is null
  or created_at is null
  or updated_at is null;

alter table public.availability_slots
alter column experience_id set not null;

alter table public.availability_slots
alter column start_at set not null;

alter table public.availability_slots
alter column end_at set not null;

alter table public.availability_slots
alter column capacity set not null;

alter table public.availability_slots
alter column spots_remaining set not null;

alter table public.availability_slots
alter column status set not null;

alter table public.availability_slots
drop constraint if exists availability_slots_time_check;

alter table public.availability_slots
add constraint availability_slots_time_check
check (end_at > start_at);

alter table public.availability_slots
drop constraint if exists availability_slots_spots_check;

alter table public.availability_slots
add constraint availability_slots_spots_check
check (spots_remaining >= 0 and spots_remaining <= capacity);

create index if not exists idx_availability_slots_experience_id
on public.availability_slots (experience_id);

create index if not exists idx_availability_slots_start_at
on public.availability_slots (start_at);

create unique index if not exists idx_availability_slots_unique_slot
on public.availability_slots (experience_id, start_at);

alter table public.availability_slots enable row level security;

drop policy if exists "public read open availability_slots" on public.availability_slots;
create policy "public read open availability_slots"
on public.availability_slots
for select
using (
  status = 'open'
  and start_at >= now()
);

drop policy if exists "vendor manage own availability_slots" on public.availability_slots;
create policy "vendor manage own availability_slots"
on public.availability_slots
for all
to authenticated
using (
  exists (
    select 1
    from public.experiences e
    join public.vendors v on v.id = e.vendor_id
    where e.id = availability_slots.experience_id
      and v.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.experiences e
    join public.vendors v on v.id = e.vendor_id
    where e.id = availability_slots.experience_id
      and v.owner_user_id = auth.uid()
  )
);

drop policy if exists "admin manage all availability_slots" on public.availability_slots;
create policy "admin manage all availability_slots"
on public.availability_slots
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