create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_vendors_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

create trigger set_experiences_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

create trigger set_availability_slots_updated_at
before update on public.availability_slots
for each row execute function public.set_updated_at();

create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger set_payment_intents_updated_at
before update on public.payment_intents
for each row execute function public.set_updated_at();

create index idx_experiences_public_search
on public.experiences (status, is_active, region_id, category_id);

create index idx_experiences_vendor_id
on public.experiences (vendor_id);

create index idx_slots_experience_starts
on public.availability_slots (experience_id, starts_at);

create index idx_slots_open_starts
on public.availability_slots (starts_at, status);

create index idx_holds_slot_status_expires
on public.inventory_holds (slot_id, status, expires_at);

create index idx_bookings_tourist_created
on public.bookings (tourist_user_id, created_at desc);

create index idx_bookings_vendor_created
on public.bookings (vendor_id, created_at desc);

create index idx_bookings_status_created
on public.bookings (status, created_at desc);

create index idx_notifications_user_created
on public.notifications (user_id, created_at desc);

create index idx_experiences_fts
on public.experiences
using gin (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' ||
    coalesce(subtitle, '') || ' ' ||
    coalesce(short_description, '') || ' ' ||
    coalesce(description, '')
  )
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_vendor_member(target_vendor_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.vendor_members vm
    join public.profiles p on p.id = vm.user_id
    where vm.vendor_id = target_vendor_id
      and vm.user_id = auth.uid()
      and p.status = 'active'
  );
$$;