import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type VendorRow = {
  business_name: string;
  is_verified: boolean;
  verification_status: string;
  slug?: string;
};

type ExperienceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  base_price: number;
  base_price_type: "per_person" | "per_group";
  booking_mode: "instant" | "request";
  min_guests: number;
  max_guests: number | null;
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
  starts_at: string;
  ends_at: string;
  spots_remaining: number;
  status: string;
};

type BlackoutRow = {
  id: string;
  starts_at: string;
  ends_at: string;
};

function isBlocked(slot: SlotRow, blackouts: BlackoutRow[]) {
  const slotStart = new Date(slot.starts_at).getTime();
  const slotEnd = new Date(slot.ends_at).getTime();

  return blackouts.some((blackout) => {
    const blackoutStart = new Date(blackout.starts_at).getTime();
    const blackoutEnd = new Date(blackout.ends_at).getTime();

    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

export default async function ExperiencePage(
  props: {
    params: Promise<{ slug: string }>;
  },
) {
  const { slug } = await props.params;

  const { data } = await supabaseAdmin
    .from("experiences")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      description,
      base_price,
      base_price_type,
      booking_mode,
      min_guests,
      max_guests,
      vendors (
        business_name,
        is_verified,
        verification_status,
        slug
      )
    `,
    )
    .eq("slug", slug)
    .single();

  const item = (data as unknown as ExperienceRow | null) ?? null;

  if (!item) notFound();

  const vendor = item.vendors?.[0] ?? null;

  const { data: imageData } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .eq("experience_id", item.id)
    .order("sort_order", { ascending: true });

  const images = (imageData ?? []) as ImageRow[];

  const { data: slotData } = await supabaseAdmin
    .from("availability_slots")
    .select("id, starts_at, ends_at, spots_remaining, status")
    .eq("experience_id", item.id)
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  const { data: blackoutData } = await supabaseAdmin
    .from("availability_blackouts")
    .select("id, starts_at, ends_at")
    .eq("experience_id", item.id)
    .order("starts_at", { ascending: true });

  const rawSlots = (slotData ?? []) as SlotRow[];
  const blackouts = (blackoutData ?? []) as BlackoutRow[];
  const slots = rawSlots.filter((slot) => !isBlocked(slot, blackouts)).slice(0, 6);

  const hero =
    images.find((img) => img.is_cover === true)?.image_url ||
    images[0]?.image_url ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  const gallery = images.filter((img) => img.image_url !== hero).slice(0, 4);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultCtaHref = user
    ? `/book/${item.slug}`
    : `/auth/login?next=/book/${item.slug}`;

  const defaultCtaText = user ? "Request booking" : "Login to request";

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5">
          <div className="relative h-[420px] sm:h-[560px]">
            <img
              src={hero}
              alt={item.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-10">
              <div className="flex flex-wrap gap-2">
                {vendor?.is_verified ? (
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                    <ShieldCheck className="mr-1.5" size={14} />
                    Verified partner
                  </span>
                ) : null}

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {item.booking_mode === "instant" ? "Instant book" : "Request to book"}
                </span>
              </div>

              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
                {item.title}
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                {item.short_description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                icon={<Users size={19} />}
                label="Guests"
                value={`${item.min_guests} - ${item.max_guests ?? "Any"}`}
              />
              <InfoCard
                icon={<CalendarDays size={19} />}
                label="Booking"
                value={item.booking_mode === "instant" ? "Instant" : "Request"}
              />
              <InfoCard
                icon={<CheckCircle2 size={19} />}
                label="Partner"
                value={vendor?.business_name || "Local partner"}
              />
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">About this experience</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-neutral-700">
                {item.description}
              </p>
            </div>
          </div>

          {gallery.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {gallery.map((img) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt=""
                  className="h-56 w-full rounded-[1.5rem] object-cover shadow-sm ring-1 ring-black/5"
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24">
          <p className="text-sm text-neutral-500">Starting from</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-4xl font-semibold">${item.base_price}</p>
            <p className="pb-1 text-sm text-neutral-500">
              {item.base_price_type === "per_group" ? "per group" : "per person"}
            </p>
          </div>

          {vendor ? (
            <div className="mt-5 rounded-3xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Partner
              </p>
              <p className="mt-1 font-medium">{vendor.business_name}</p>
              {vendor.is_verified ? (
                <p className="mt-1 text-sm text-green-700">Verified by Lucia Now</p>
              ) : null}
            </div>
          ) : null}

          {slots.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-neutral-700">
                Next available times
              </p>

              <div className="space-y-3">
                {slots.map((slot) => {
                  const href = user
                    ? `/book/${item.slug}?slot=${slot.id}`
                    : `/auth/login?next=/book/${item.slug}?slot=${slot.id}`;

                  return (
                    <Link
                      key={slot.id}
                      href={href}
                      className="block rounded-3xl bg-neutral-50 p-4 transition hover:bg-neutral-100"
                    >
                      <p className="font-medium">
                        {new Date(slot.starts_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {slot.spots_remaining} spots currently available
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-600">
              No listed times right now. Send a request and the partner can follow up.
            </div>
          )}

          <Link
            href={defaultCtaHref}
            className="mt-6 block rounded-full bg-neutral-950 px-5 py-4 text-center font-medium text-white"
          >
            {defaultCtaText}
          </Link>

          <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
            You only pay after the partner accepts your request.
          </p>
        </aside>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <div className="text-neutral-500">{icon}</div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}