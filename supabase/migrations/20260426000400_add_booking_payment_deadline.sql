alter table public.booking_requests
add column if not exists payment_due_at timestamptz;

alter table public.booking_requests
add column if not exists expired_at timestamptz;

alter table public.booking_requests
drop constraint if exists booking_requests_status_check;

alter table public.booking_requests
drop constraint if exists booking_requests_contact_status_check;

alter table public.booking_requests
add constraint booking_requests_status_check
check (
  status in (
    'new',
    'contacted',
    'pending_payment',
    'confirmed',
    'declined',
    'cancelled',
    'expired'
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
    'cancelled',
    'expired'
  )
);

create index if not exists booking_requests_payment_due_at_idx
on public.booking_requests(payment_due_at);

create index if not exists booking_requests_expired_at_idx
on public.booking_requests(expired_at);
