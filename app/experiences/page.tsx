import Link from "next/link";
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
  searchParams: Promise<{
    q?: string;
  }>;
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
  const items: ExperienceRow[] = (data ?? []) as unknown as ExperienceRow[];

  const ids = items.map((x) => x.id);

  const { data: imageData } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .in("experience_id", ids);

  const images: ImageRow[] = (imageData ?? []) as ImageRow[];

  const { data: slotData } = await supabaseAdmin
    .from("availability_slots")
    .select("id, experience_id, starts_at, ends_at, spots_remaining, status")
    .in("experience_id", ids)
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const { data: blackoutData } = await supabaseAdmin
    .from("availability_blackouts")
    .select("id, experience_id, starts_at, ends_at")
    .in("experience_id", ids);

  const rawSlots: SlotRow[] = (slotData ?? []) as SlotRow[];
  const blackouts: BlackoutRow[] = (blackoutData ?? []) as BlackoutRow[];
  const slots = rawSlots.filter((slot) => !isBlocked(slot, blackouts));

  function cover(id: string) {
    const coverImage =
      images.find((img) => img.experience_id === id && img.is_cover === true) ||
      images.find((img) => img.experience_id === id);

    return (
      coverImage?.image_url ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    );
  }

  function bookingBadge(item: ExperienceRow) {
    return item.booking_mode === "instant" ? "Instant Book" : "Request Booking";
  }

  function vendorOf(item: ExperienceRow) {
    return item.vendors?.[0] ?? null;
  }

  function slotsForExperience(id: string) {
    return slots.filter((slot) => slot.experience_id === id);
  }

  function nextSlotLabel(id: string) {
    const next = slotsForExperience(id)[0];
    if (!next) return null;
    return new Date(next.starts_at).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          Discover St Lucia
        </p>

        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          Book premium island experiences
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-neutral-600">
          Trusted tours, private transport, luxury boat trips and unforgettable
          experiences available now.
        </p>

        <form className="mt-10 flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search tours, boats, drivers..."
            className="w-full rounded-xl border bg-white px-5 py-4"
          />

          <button className="rounded-xl bg-black px-6 text-white">
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/experiences?q=boat" className="rounded-full bg-white px-4 py-2 shadow-sm">
            Boat Trips
          </Link>
          <Link href="/experiences?q=driver" className="rounded-full bg-white px-4 py-2 shadow-sm">
            Drivers
          </Link>
          <Link href="/experiences?q=tour" className="rounded-full bg-white px-4 py-2 shadow-sm">
            Island Tours
          </Link>
          <Link href="/experiences?q=sunset" className="rounded-full bg-white px-4 py-2 shadow-sm">
            Sunset
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const vendor = vendorOf(item);
            const itemSlots = slotsForExperience(item.id);
            const nextSlot = nextSlotLabel(item.id);

            return (
              <Link
                key={item.id}
                href={`/experiences/${item.slug}`}
                className="overflow-hidden rounded-3xl bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={cover(item.id)}
                  alt={item.title}
                  className="h-64 w-full object-cover"
                />

                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {vendor?.is_verified ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Verified Vendor
                      </span>
                    ) : null}

                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {bookingBadge(item)}
                    </span>

                    {itemSlots.length > 0 ? (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {itemSlots.length} slot{itemSlots.length > 1 ? "s" : ""} available
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    {vendor?.business_name || "Local partner"}
                  </p>

                  <p className="mt-3 line-clamp-2 text-sm text-neutral-500">
                    {item.short_description}
                  </p>

                  {nextSlot ? (
                    <div className="mt-4 rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-700">
                      <p className="font-medium">Next available</p>
                      <p className="mt-1 text-neutral-500">{nextSlot}</p>
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">From</p>
                      <p className="text-2xl font-semibold">${item.base_price}</p>
                      <p className="text-xs text-neutral-400">
                        {item.base_price_type === "per_group" ? "Per group" : "Per person"}
                      </p>
                    </div>

                    <span className="rounded-xl bg-black px-4 py-2 text-sm text-white">
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