insert into public.regions (slug, country_code, island_code, name, currency, timezone)
values ('st-lucia', 'LC', 'st_lucia', 'St Lucia', 'USD', 'America/St_Lucia')
on conflict do nothing;

insert into public.categories (slug, name, sort_order)
values
  ('boat-trips', 'Boat Trips', 1),
  ('snorkeling', 'Snorkeling', 2),
  ('private-drivers', 'Private Drivers', 3),
  ('island-tours', 'Island Tours', 4),
  ('sunset-cruises', 'Sunset Cruises', 5)
on conflict do nothing;

insert into public.locations (region_id, name, slug, kind)
select r.id, x.name, x.slug, x.kind
from public.regions r
cross join (
  values
    ('Rodney Bay', 'rodney-bay', 'town'),
    ('Soufrière', 'soufriere', 'town'),
    ('Castries', 'castries', 'town'),
    ('Marigot Bay', 'marigot-bay', 'marina'),
    ('Pigeon Island', 'pigeon-island', 'beach')
) as x(name, slug, kind)
where r.slug = 'st-lucia'
on conflict do nothing;