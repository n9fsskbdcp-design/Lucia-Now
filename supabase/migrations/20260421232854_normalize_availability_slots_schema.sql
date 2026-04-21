alter table public.availability_slots
add column if not exists starts_at timestamptz;

alter table public.availability_slots
add column if not exists ends_at timestamptz;

alter table public.availability_slots
add column if not exists capacity_total int;

update public.availability_slots
set starts_at = start_at
where starts_at is null
  and start_at is not null;

update public.availability_slots
set ends_at = end_at
where ends_at is null
  and end_at is not null;

update public.availability_slots
set capacity_total = capacity
where capacity_total is null
  and capacity is not null;

update public.availability_slots
set spots_remaining = capacity_total
where spots_remaining is null
  and capacity_total is not null;

alter table public.availability_slots
alter column starts_at set not null;

alter table public.availability_slots
alter column ends_at set not null;

alter table public.availability_slots
alter column capacity_total set not null;

alter table public.availability_slots
alter column spots_remaining set not null;

alter table public.availability_slots
drop constraint if exists availability_slots_time_check;

alter table public.availability_slots
add constraint availability_slots_time_check
check (ends_at > starts_at);

alter table public.availability_slots
drop constraint if exists availability_slots_spots_check;

alter table public.availability_slots
add constraint availability_slots_spots_check
check (spots_remaining >= 0 and spots_remaining <= capacity_total);

drop policy if exists "public read open availability_slots" on public.availability_slots;
drop policy if exists "vendor manage own availability_slots" on public.availability_slots;
drop policy if exists "admin manage all availability_slots" on public.availability_slots;

drop index if exists idx_availability_slots_start_at;
drop index if exists idx_availability_slots_starts_at;
drop index if exists idx_availability_slots_unique_slot;
drop index if exists idx_availability_slots_unique_slot_v2;

alter table public.availability_slots
drop column if exists start_at;

alter table public.availability_slots
drop column if exists end_at;

alter table public.availability_slots
drop column if exists capacity;

create index if not exists idx_availability_slots_starts_at
on public.availability_slots (starts_at);

create unique index if not exists idx_availability_slots_unique_slot_v2
on public.availability_slots (experience_id, starts_at);

alter table public.availability_slots enable row level security;

create policy "public read open availability_slots"
on public.availability_slots
for select
using (
  status = 'open'
  and starts_at >= now()
);

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