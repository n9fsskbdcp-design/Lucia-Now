create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guests int not null check (guests > 0),
  notes text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;

drop policy if exists "admin full booking_requests" on public.booking_requests;
create policy "admin full booking_requests"
on public.booking_requests
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

drop policy if exists "vendor read own booking_requests" on public.booking_requests;
create policy "vendor read own booking_requests"
on public.booking_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.experiences e
    join public.vendor_members vm on vm.vendor_id = e.vendor_id
    where e.id = booking_requests.experience_id
      and vm.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.experiences e
    join public.vendors v on v.id = e.vendor_id
    where e.id = booking_requests.experience_id
      and v.owner_user_id = auth.uid()
  )
);

create index if not exists idx_booking_requests_experience_id
on public.booking_requests (experience_id);

create index if not exists idx_booking_requests_created_at
on public.booking_requests (created_at desc);