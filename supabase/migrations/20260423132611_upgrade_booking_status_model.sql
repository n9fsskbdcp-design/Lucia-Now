alter table public.booking_requests
add column if not exists payment_status text not null default 'unpaid'
check (payment_status in ('unpaid', 'paid', 'refunded'));

alter table public.booking_requests
add column if not exists confirmed_at timestamptz;

alter table public.booking_requests
add column if not exists paid_at timestamptz;