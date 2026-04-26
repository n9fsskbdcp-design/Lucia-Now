alter table public.booking_requests
add column if not exists archived_by_tourist boolean not null default false;

alter table public.booking_requests
add column if not exists archived_by_vendor boolean not null default false;

create index if not exists booking_requests_archived_by_tourist_idx
on public.booking_requests(archived_by_tourist);

create index if not exists booking_requests_archived_by_vendor_idx
on public.booking_requests(archived_by_vendor);