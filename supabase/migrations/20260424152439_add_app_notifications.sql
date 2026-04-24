create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_notifications_user_id_read_at
on public.app_notifications (user_id, read_at);

create index if not exists idx_app_notifications_vendor_id_read_at
on public.app_notifications (vendor_id, read_at);

create index if not exists idx_app_notifications_created_at
on public.app_notifications (created_at desc);