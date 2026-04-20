create extension if not exists pgcrypto;

create type public.app_role as enum ('tourist', 'vendor', 'admin');
create type public.profile_status as enum ('active', 'suspended', 'pending');
create type public.vendor_verification_status as enum ('draft', 'submitted', 'approved', 'rejected', 'suspended');
create type public.experience_status as enum ('draft', 'pending_review', 'published', 'paused', 'archived');
create type public.booking_mode as enum ('instant', 'request');
create type public.booking_status as enum ('pending_payment', 'pending_vendor', 'confirmed', 'declined', 'cancelled', 'refunded', 'completed', 'no_show', 'expired');
create type public.payment_status as enum ('unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed');
create type public.slot_status as enum ('open', 'closed', 'sold_out', 'cancelled');
create type public.hold_status as enum ('active', 'expired', 'converted', 'released');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  avatar_url text,
  role public.app_role not null default 'tourist',
  status public.profile_status not null default 'active',
  default_currency text not null default 'USD',
  locale text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country_code text not null,
  island_code text not null unique,
  name text not null,
  currency text not null default 'USD',
  timezone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  name text not null,
  slug text not null,
  kind text not null check (kind in ('town', 'marina', 'beach', 'pickup_zone', 'meeting_point')),
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz not null default now(),
  unique (region_id, slug)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  business_name text not null,
  slug text not null unique,
  legal_name text,
  support_email text,
  support_phone text,
  description text,
  is_verified boolean not null default false,
  verification_status public.vendor_verification_status not null default 'draft',
  stripe_account_id text unique,
  payout_status text,
  response_sla_minutes int not null default 60,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_members (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (vendor_id, user_id)
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete restrict,
  primary_location_id uuid references public.locations(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  subtitle text,
  short_description text,
  description text,
  booking_mode public.booking_mode not null default 'instant',
  status public.experience_status not null default 'draft',
  duration_minutes int not null check (duration_minutes > 0),
  min_guests int not null default 1 check (min_guests > 0),
  max_guests int check (max_guests >= min_guests),
  base_currency text not null default 'USD',
  base_price_type text not null check (base_price_type in ('per_person', 'per_group')),
  cutoff_minutes int not null default 180 check (cutoff_minutes >= 0),
  lead_time_priority boolean not null default false,
  instant_book_enabled boolean not null default true,
  featured_score int not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  is_active boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experience_media (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('image', 'video')),
  sort_order int not null default 0,
  alt_text text,
  created_at timestamptz not null default now()
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  name text not null,
  date_start date,
  date_end date,
  day_of_week int[],
  guest_min int,
  guest_max int,
  price_type text not null check (price_type in ('per_person', 'per_group', 'add_on')),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.experience_schedules (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  name text not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  default_capacity int not null check (default_capacity > 0),
  cutoff_minutes int not null default 180,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  schedule_id uuid references public.experience_schedules(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity_total int not null check (capacity_total >= 0),
  capacity_reserved int not null default 0 check (capacity_reserved >= 0),
  capacity_held int not null default 0 check (capacity_held >= 0),
  status public.slot_status not null default 'open',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (experience_id, starts_at),
  check (ends_at > starts_at),
  check (capacity_reserved + capacity_held <= capacity_total)
);

create table public.inventory_holds (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid,
  qty int not null check (qty > 0),
  expires_at timestamptz not null,
  status public.hold_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text not null unique,
  tourist_user_id uuid not null references public.profiles(id) on delete restrict,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  experience_id uuid not null references public.experiences(id) on delete restrict,
  slot_id uuid not null references public.availability_slots(id) on delete restrict,
  status public.booking_status not null,
  booking_mode public.booking_mode not null,
  guest_count int not null check (guest_count > 0),
  currency text not null default 'USD',
  subtotal_amount numeric(10,2) not null default 0,
  addons_amount numeric(10,2) not null default 0,
  pickup_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  platform_fee_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  payment_status public.payment_status not null default 'unpaid',
  customer_notes text,
  vendor_notes text,
  source_channel text not null default 'web',
  cancel_reason text,
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_guests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  age_band text,
  special_requirements text
);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null,
  currency text not null,
  status text not null,
  client_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);