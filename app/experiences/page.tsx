import Link from "next/link";
import { Search } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

type VendorRow = {
  business_name: string;
  is_verified: boolean;
  verification_status: string;
};

type ExperienceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  base_price: number;
  base_price_type: "per_person" | "per_group";
  booking_mode: "instant" | "request";
  vendor_id: string;
  vendors: VendorRow[] | null;
};

type ImageRow = {
  id: string;
  experience_id: string;
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

type SlotRow = {
  id: string;
  experience_id: string;
  starts_at: string;
  ends_at: string;
  spots_remaining: number;
  status: string;
};

type BlackoutRow = {
  id: string;
  experience_id: string;
  starts_at: string;
  ends_at: string;
};

function isBlocked(slot: SlotRow, blackouts: BlackoutRow[]) {
  const slotStart = new Date(slot.starts_at).getTime();
  const slotEnd = new Date(slot.ends_at).getTime();

  return blackouts.some((blackout) => {
    if (blackout.experience_id !== slot.experience_id) return false;

    const blackoutStart = new Date(blackout.starts_at).getTime();
    const blackoutEnd = new Date(blackout.ends_at).getTime();

    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  let query = supabaseAdmin
    .from("experiences")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      base_price,
      base_price_type,
      booking_mode,
      vendor_id,
      vendors (
        business_name,
        is_verified,
        verification_status
      )
    `,
    )
    .eq("status", "published")
    .eq("is_active", true)
    .order("featured_score", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);
  }

  const { data } = await query;
  const items = (data ?? []) as unknown as ExperienceRow[];
  const ids = items.map((item) => item.id);

  const { data: imageData } = ids.length
    ? await supabaseAdmin.from("experience_images").select("*").in("experience_id", ids)
    : { data: [] };

  const { data: slotData } = ids.length
    ? await supabaseAdmin
        .from("availability_slots")
        .select("id, experience_id, starts_at, ends_at, spots_remaining, status")
        .in("experience_id", ids)
        .eq("status", "open")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
    : { data: [] };

  const { data: blackoutData } = ids.length
    ? await supabaseAdmin
        .from("availability_blackouts")
        .select("id, experience_id, starts_at, ends_at")
        .in("experience_id", ids)
    : { data: [] };

  const images = (imageData ?? []) as ImageRow[];
  const rawSlots = (slotData ?? []) as SlotRow[];
  const blackouts = (blackoutData ?? []) as BlackoutRow[];
  const slots = rawSlots.filter((slot) => !isBlocked(slot, blackouts));

  function cover(id: string) {
    const image =
      images.find((img) => img.experience_id === id && img.is_cover) ||
      images.find((img) => img.experience_id === id);

    return (
      image?.image_url ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    );
  }

  function slotsFor(id: string) {
    return slots.filter((slot) => slot.experience_id === id);
  }

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-16">
        <div className="rounded-[2rem] bg-neutral-950 px-5 py-8 text-white shadow-xl sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
            Lucia Now
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Find trusted island experiences
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Book curated tours, transport, boat days, and local experiences with verified Saint Lucia partners.
          </p>

          <form className="mt-8 flex flex-col gap-3 rounded-3xl bg-white p-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search size={18} className="text-neutral-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search boat, driver, sunset..."
                className="w-full border-0 bg-transparent py-3 text-neutral-950 shadow-none focus:shadow-none"
              />
            </div>

            <button className="rounded-2xl bg-neutral-950 px-6 py-3 font-medium text-white sm:min-w-32">
              Search
            </button>
          </form>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {[
            ["Boat trips", "boat"],
            ["Drivers", "driver"],
            ["Island tours", "tour"],
            ["Sunset", "sunset"],
            ["Private", "private"],
          ].map(([label, value]) => (
            <Link
              key={value}
              href={`/experiences?q=${value}`}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm text-neutral-500">
              {items.length} experience{items.length === 1 ? "" : "s"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Available now</h2>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const vendor = item.vendors?.[0];
            const itemSlots = slotsFor(item.id);
            const nextSlot = itemSlots[0];

            return (
              <Link
                key={item.id}
                href={`/experiences/${item.slug}`}
                className="group overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden sm:h-64">
                  <img
                    src={cover(item.id)}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {vendor?.is_verified ? (
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-900 backdrop-blur">
                        Verified
                      </span>
                    ) : null}

                    {itemSlots.length > 0 ? (
                      <span className="rounded-full bg-neutral-950/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {itemSlots.length} slots
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-neutral-500">
                    {vendor?.business_name || "Local partner"}
                  </p>

                  <h3 className="mt-2 text-xl font-semibold leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
                    {item.short_description}
                  </p>

                  {nextSlot ? (
                    <div className="mt-4 rounded-2xl bg-neutral-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Next available
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">
                        {new Date(nextSlot.starts_at).toLocaleString()}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">From</p>
                      <p className="text-2xl font-semibold">${item.base_price}</p>
                    </div>

                    <span className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                      View
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}