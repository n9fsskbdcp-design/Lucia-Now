alter table public.booking_requests
add column if not exists user_id uuid references public.profiles(id) on delete set null;

alter table public.booking_requests
add column if not exists slot_id uuid references public.availability_slots(id) on delete set null;

alter table public.booking_requests
add column if not exists vendor_id uuid references public.vendors(id) on delete set null;

alter table public.booking_requests
add column if not exists requested_start_at timestamptz;

alter table public.booking_requests
add column if not exists requested_end_at timestamptz;

alter table public.booking_requests
add column if not exists contact_status text not null default 'new'
check (contact_status in ('new', 'contacted', 'confirmed', 'declined'));

create index if not exists idx_booking_requests_user_id
on public.booking_requests (user_id);

create index if not exists idx_booking_requests_slot_id
on public.booking_requests (slot_id);

create index if not exists idx_booking_requests_vendor_id
on public.booking_requests (vendor_id);

drop policy if exists "users read own booking_requests" on public.booking_requests;
create policy "users read own booking_requests"
on public.booking_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "authenticated insert own booking_requests" on public.booking_requests;
create policy "authenticated insert own booking_requests"
on public.booking_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  or user_id is null
);