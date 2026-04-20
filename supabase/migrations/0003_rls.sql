alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_members enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_media enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.experience_schedules enable row level security;
alter table public.availability_slots enable row level security;
alter table public.inventory_holds enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_guests enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.payment_intents enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_self_read"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_self_update"
on public.profiles
for update
using (id = auth.uid() or public.is_admin());

create policy "public_regions_read"
on public.regions
for select
using (true);

create policy "public_locations_read"
on public.locations
for select
using (true);

create policy "public_categories_read"
on public.categories
for select
using (true);

create policy "vendors_public_read_live"
on public.vendors
for select
using (is_live = true or public.is_admin() or public.is_vendor_member(id));

create policy "vendors_member_update"
on public.vendors
for update
using (public.is_vendor_member(id) or public.is_admin());

create policy "vendor_members_read_own_vendor"
on public.vendor_members
for select
using (public.is_vendor_member(vendor_id) or public.is_admin());

create policy "experiences_public_read"
on public.experiences
for select
using (
  (status = 'published' and is_active = true)
  or public.is_admin()
  or public.is_vendor_member(vendor_id)
);

create policy "experiences_vendor_insert"
on public.experiences
for insert
with check (public.is_vendor_member(vendor_id) or public.is_admin());

create policy "experiences_vendor_update"
on public.experiences
for update
using (public.is_vendor_member(vendor_id) or public.is_admin());

create policy "experience_media_read"
on public.experience_media
for select
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and ((e.status = 'published' and e.is_active = true) or public.is_admin() or public.is_vendor_member(e.vendor_id))
  )
);

create policy "experience_media_vendor_write"
on public.experience_media
for all
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
);

create policy "pricing_rules_vendor_access"
on public.pricing_rules
for all
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
);

create policy "schedules_vendor_access"
on public.experience_schedules
for all
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
);

create policy "slots_public_read_open_for_published"
on public.availability_slots
for select
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and ((e.status = 'published' and e.is_active = true) or public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
);

create policy "slots_vendor_write"
on public.availability_slots
for all
using (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.experiences e
    where e.id = experience_id
      and (public.is_vendor_member(e.vendor_id) or public.is_admin())
  )
);

create policy "holds_owner_read"
on public.inventory_holds
for select
using (user_id = auth.uid() or public.is_admin());

create policy "bookings_owner_or_vendor_read"
on public.bookings
for select
using (
  tourist_user_id = auth.uid()
  or public.is_vendor_member(vendor_id)
  or public.is_admin()
);

create policy "bookings_owner_insert"
on public.bookings
for insert
with check (tourist_user_id = auth.uid() or public.is_admin());

create policy "booking_guests_owner_vendor_read"
on public.booking_guests
for select
using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (
        b.tourist_user_id = auth.uid()
        or public.is_vendor_member(b.vendor_id)
        or public.is_admin()
      )
  )
);

create policy "booking_history_owner_vendor_read"
on public.booking_status_history
for select
using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (
        b.tourist_user_id = auth.uid()
        or public.is_vendor_member(b.vendor_id)
        or public.is_admin()
      )
  )
);

create policy "notifications_own_read"
on public.notifications
for select
using (user_id = auth.uid() or public.is_admin());

create policy "notifications_own_update"
on public.notifications
for update
using (user_id = auth.uid() or public.is_admin());