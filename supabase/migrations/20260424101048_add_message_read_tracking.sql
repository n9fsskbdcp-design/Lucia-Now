alter table public.booking_messages
add column if not exists read_at timestamptz;

alter table public.booking_messages
add column if not exists recipient_role text check (recipient_role in ('tourist', 'vendor', 'admin'));

update public.booking_messages
set recipient_role =
  case
    when sender_role = 'tourist' then 'vendor'
    when sender_role = 'vendor' then 'tourist'
    else 'tourist'
  end
where recipient_role is null;

create index if not exists idx_booking_messages_recipient_role_read_at
on public.booking_messages (recipient_role, read_at);