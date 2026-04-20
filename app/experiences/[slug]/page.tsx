import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  vendors: {
    business_name: string;
    is_verified: boolean;
    verification_status: string;
  } | null;
};

type ImageRow = {
  id: string;
  experience_id: string;
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

export default async function ExperiencePage(
  props: {
    params: Promise<{ slug: string }>;
  }
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
        verification_status
      )
    `
    )
    .eq("slug", slug)
    .single();

  const item = data as ExperienceRow | null;

  if (!item) notFound();

  const { data: imageData } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .eq("experience_id", item.id)
    .order("sort_order", { ascending: true });

  const images = (imageData ?? []) as ImageRow[];

  const hero =
    images.find((img) => img.is_cover === true)?.image_url ||
    images[0]?.image_url ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user
    ? `/book/${item.slug}`
    : `/auth/login?next=/book/${item.slug}`;

  const ctaText = user ? "Reserve Now" : "Login to Book";

  return (
    <main className="bg-white">
      <section className="relative h-[560px]">
        <img
          src={hero}
          alt={item.title}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-6 pb-10 text-white">
          <div className="flex flex-wrap gap-2">
            {item.vendors?.is_verified ? (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs">
                Verified Vendor
              </span>
            ) : null}

            <span className="rounded-full bg-white/20 px-3 py-1 text-xs">
              {item.booking_mode === "instant"
                ? "Instant Book"
                : "Request Booking"}
            </span>
          </div>

          <h1 className="mt-5 text-5xl font-semibold">{item.title}</h1>

          <p className="mt-3 text-sm text-white/80">
            By {item.vendors?.business_name || "Local partner"}
          </p>

          <p className="mt-4 max-w-2xl text-lg text-white/90">
            {item.short_description}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-2xl font-semibold">About this experience</h2>

          <p className="mt-5 whitespace-pre-line leading-8 text-neutral-700">
            {item.description}
          </p>

          {images.length > 1 ? (
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {images.slice(1).map((img) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt=""
                  className="h-56 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-3xl border p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Starting from</p>

          <p className="mt-2 text-4xl font-semibold">${item.base_price}</p>

          <p className="mt-2 text-sm text-neutral-500">
            {item.base_price_type === "per_group"
              ? "Per group"
              : "Per person"}
          </p>

          <div className="mt-6 space-y-3 text-sm text-neutral-600">
            <p>
              Booking:{" "}
              {item.booking_mode === "instant"
                ? "Instant confirmation"
                : "Vendor approval required"}
            </p>

            <p>
              Guests: {item.min_guests} - {item.max_guests ?? "—"}
            </p>
          </div>

          <Link
            href={ctaHref}
            className="mt-8 block rounded-xl bg-black px-5 py-4 text-center text-white"
          >
            {ctaText}
          </Link>
        </aside>
      </section>
    </main>
  );
}