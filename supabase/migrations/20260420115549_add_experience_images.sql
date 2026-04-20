alter table public.experience_images
add column if not exists sort_order int default 0;

alter table public.experience_images
add column if not exists is_cover boolean default false;

alter table public.experience_images
add column if not exists created_at timestamptz default now();