create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete cascade,
  type text not null default 'platform_alert',
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_notifications_user_id_idx
on public.app_notifications(user_id);

create index if not exists app_notifications_vendor_id_idx
on public.app_notifications(vendor_id);

create index if not exists app_notifications_read_at_idx
on public.app_notifications(read_at);

create index if not exists app_notifications_created_at_idx
on public.app_notifications(created_at desc);

alter table public.app_notifications enable row level security;

drop policy if exists "Users can read own app notifications" on public.app_notifications;
drop policy if exists "Vendors can read own vendor notifications" on public.app_notifications;
drop policy if exists "Users can update own app notifications" on public.app_notifications;
drop policy if exists "Vendors can update own vendor notifications" on public.app_notifications;

create policy "Users can read own app notifications"
on public.app_notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Vendors can read own vendor notifications"
on public.app_notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors
    where vendors.id = app_notifications.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

create policy "Users can update own app notifications"
on public.app_notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Vendors can update own vendor notifications"
on public.app_notifications
for update
to authenticated
using (
  exists (
    select 1
    from public.vendors
    where vendors.id = app_notifications.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors
    where vendors.id = app_notifications.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

alter table public.booking_requests
add column if not exists cancelled_at timestamptz;

alter table public.booking_requests
add column if not exists cancelled_by text;

alter table public.booking_requests
add column if not exists status_updated_at timestamptz;

alter table public.booking_requests
drop constraint if exists booking_requests_status_check;

alter table public.booking_requests
drop constraint if exists booking_requests_contact_status_check;

alter table public.booking_requests
drop constraint if exists booking_requests_payment_status_check;

alter table public.booking_requests
add constraint booking_requests_status_check
check (
  status in (
    'new',
    'contacted',
    'pending_payment',
    'confirmed',
    'declined',
    'cancelled'
  )
);

alter table public.booking_requests
add constraint booking_requests_contact_status_check
check (
  contact_status in (
    'new',
    'contacted',
    'confirmed_pending_payment',
    'paid_confirmed',
    'declined',
    'cancelled'
  )
);

alter table public.booking_requests
add constraint booking_requests_payment_status_check
check (
  payment_status in (
    'unpaid',
    'paid',
    'refunded'
  )
);