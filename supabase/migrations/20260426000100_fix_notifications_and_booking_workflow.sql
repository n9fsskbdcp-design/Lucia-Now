alter table booking_requests
add column if not exists cancelled_at timestamptz;

alter table booking_requests
add column if not exists cancelled_by text;

alter table booking_requests
add column if not exists status_updated_at timestamptz;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'booking_requests'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%contact_status%'
        or pg_get_constraintdef(oid) ilike '%payment_status%'
        or pg_get_constraintdef(oid) ilike '%status%'
      )
  loop
    execute format(
      'alter table booking_requests drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table booking_requests
add constraint booking_requests_status_check
check (
  status in (
    'new',
    'contacted',
    'pending_payment',
    'confirmed',
    'declined',
    'cancelled'
  )
);

alter table booking_requests
add constraint booking_requests_contact_status_check
check (
  contact_status in (
    'new',
    'contacted',
    'confirmed_pending_payment',
    'paid_confirmed',
    'declined',
    'cancelled'
  )
);

alter table booking_requests
add constraint booking_requests_payment_status_check
check (
  payment_status in (
    'unpaid',
    'paid',
    'refunded'
  )
);

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'app_notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format(
      'alter table app_notifications drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table app_notifications
add constraint app_notifications_type_check
check (
  type in (
    'booking_request',
    'booking_request_sent',
    'booking_status_update',
    'booking_message',
    'booking_paid',
    'booking_cancelled',
    'platform_alert'
  )
);