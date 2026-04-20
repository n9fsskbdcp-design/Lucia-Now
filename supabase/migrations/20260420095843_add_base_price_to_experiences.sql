alter table public.experiences
add column if not exists base_price numeric(10,2) not null default 0;