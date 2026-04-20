create table if not exists public.experience_images (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  image_url text not null,
  sort_order int default 0,
  is_cover boolean default false,
  created_at timestamptz default now()
);

alter table public.experience_images enable row level security;

create policy "public read images"
on public.experience_images
for select
using (true);

create policy "authenticated manage images"
on public.experience_images
for all
to authenticated
using (true)
with check (true);