create table if not exists public.notifications_queue (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  recipient_email text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_queue_status
on public.notifications_queue (status);

create index if not exists idx_notifications_queue_created_at
on public.notifications_queue (created_at desc);