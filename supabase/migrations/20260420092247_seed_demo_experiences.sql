with st_lucia_region as (
  select id from public.regions where slug = 'st-lucia' limit 1
),
boat_trips_category as (
  select id from public.categories where slug = 'boat-trips' limit 1
),
island_tours_category as (
  select id from public.categories where slug = 'island-tours' limit 1
),
drivers_category as (
  select id from public.categories where slug = 'private-drivers' limit 1
),
rodney_bay_location as (
  select id from public.locations where slug = 'rodney-bay' limit 1
),
soufriere_location as (
  select id from public.locations where slug = 'soufriere' limit 1
),
demo_vendor as (
  insert into public.vendors (
    id,
    owner_user_id,
    business_name,
    slug,
    description,
    is_verified,
    verification_status,
    is_live
  )
  values (
    '22222222-2222-2222-2222-222222222222',
    '9bef316a-601b-4f7e-a441-16cfb8b4b480',
    'Lucia Coastal Adventures',
    'lucia-coastal-adventures',
    'Premium boat trips, scenic tours, and private island transport.',
    true,
    'approved',
    true
  )
  on conflict (id) do nothing
  returning id
),
demo_vendor_fallback as (
  select id from demo_vendor
  union
  select id from public.vendors
  where id = '22222222-2222-2222-2222-222222222222'
)
insert into public.experiences (
  id,
  vendor_id,
  region_id,
  primary_location_id,
  category_id,
  slug,
  title,
  subtitle,
  short_description,
  description,
  booking_mode,
  status,
  duration_minutes,
  min_guests,
  max_guests,
  base_currency,
  base_price_type,
  cutoff_minutes,
  lead_time_priority,
  instant_book_enabled,
  featured_score,
  is_active,
  published_at
)
values
(
  '33333333-3333-3333-3333-333333333331',
  (select id from demo_vendor_fallback limit 1),
  (select id from st_lucia_region limit 1),
  (select id from rodney_bay_location limit 1),
  (select id from boat_trips_category limit 1),
  'sunset-catamaran-cruise',
  'Sunset Catamaran Cruise',
  'A premium golden-hour sail along the coast.',
  'Relax on a scenic sunset cruise with drinks, music, and Piton views.',
  'Enjoy a polished late-afternoon catamaran experience designed for travelers looking for a premium same-day or next-day booking in St Lucia.',
  'instant',
  'published',
  180,
  1,
  20,
  'USD',
  'per_person',
  180,
  true,
  true,
  100,
  true,
  now()
),
(
  '33333333-3333-3333-3333-333333333332',
  (select id from demo_vendor_fallback limit 1),
  (select id from st_lucia_region limit 1),
  (select id from soufriere_location limit 1),
  (select id from island_tours_category limit 1),
  'piton-scenic-island-tour',
  'Piton Scenic Island Tour',
  'A full-island guided day trip.',
  'Visit iconic viewpoints, coastal towns, and key landmarks in one curated route.',
  'A trusted island tour format with local guidance, good pacing, and high-quality presentation for short-stay visitors.',
  'request',
  'published',
  360,
  1,
  8,
  'USD',
  'per_person',
  240,
  true,
  false,
  90,
  true,
  now()
),
(
  '33333333-3333-3333-3333-333333333333',
  (select id from demo_vendor_fallback limit 1),
  (select id from st_lucia_region limit 1),
  (select id from rodney_bay_location limit 1),
  (select id from drivers_category limit 1),
  'private-airport-transfer',
  'Private Airport Transfer',
  'Fast and reliable private transport across the island.',
  'Pre-book a smooth airport or hotel transfer with a professional local driver.',
  'Designed for travelers who need reliable transport within a short booking window, with direct coordination and clear pickup details.',
  'instant',
  'published',
  90,
  1,
  4,
  'USD',
  'per_group',
  60,
  true,
  true,
  80,
  true,
  now()
)
on conflict (id) do nothing;