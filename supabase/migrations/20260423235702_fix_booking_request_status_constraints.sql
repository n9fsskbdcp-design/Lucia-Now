alter table public.booking_requests
drop constraint if exists booking_requests_status_check;

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
drop constraint if exists booking_requests_contact_status_check;

alter table public.booking_requests
add constraint booking_requests_contact_status_check
check (
  contact_status in (
    'new',
    'contacted',
    'confirmed_pending_payment',
    'paid_confirmed',
    'declined'
  )
);

alter table public.booking_requests
drop constraint if exists booking_requests_payment_status_check;

alter table public.booking_requests
add constraint booking_requests_payment_status_check
check (
  payment_status in (
    'unpaid',
    'paid',
    'refunded'
  )
);