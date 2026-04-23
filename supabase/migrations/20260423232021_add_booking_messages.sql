create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('tourist', 'vendor', 'admin')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_messages_booking_request_id
on public.booking_messages (booking_request_id);

create index if not exists idx_booking_messages_created_at
on public.booking_messages (created_at);