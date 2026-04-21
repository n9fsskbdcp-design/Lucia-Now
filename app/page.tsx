import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ExperienceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  base_price: number;
  base_price_type: "per_person" | "per_group";
  featured_score: number | null;
};

type ImageRow = {
  id: string;
  experience_id: string;
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

export default async function HomePage() {
  const { data: experienceData } = await supabaseAdmin
    .from("experiences")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      base_price,
      base_price_type,
      featured_score
    `
    )
    .eq("status", "published")
    .eq("is_active", true)
    .order("featured_score", { ascending: false })
    .limit(6);

  const items = (experienceData ?? []) as ExperienceRow[];

  const ids = items.map((x) => x.id);

  const { data: imageData } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .in("experience_id", ids);

  const images = (imageData ?? []) as ImageRow[];

  function cover(id: string) {
    const coverImage =
      images.find(
        (img) => img.experience_id === id && img.is_cover === true,
      ) || images.find((img) => img.experience_id === id);

    return (
      coverImage?.image_url ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    );
  }

  const heroExperience = items[0] ?? null;
  const heroImage = heroExperience
    ? cover(heroExperience.id)
    : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  const featured = items.slice(0, 3);

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative min-h-[720px] overflow-hidden">
        <img
          src={heroImage}
          alt={heroExperience?.title || "St Lucia"}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-6">
          <div className="max-w-3xl text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-white/80">
              St Lucia Experiences
            </p>

            <h1 className="mt-5 text-6xl font-semibold leading-tight">
              Book unforgettable island experiences.
            </h1>

            <p className="mt-6 max-w-2xl text-xl text-white/90">
              Luxury boat days, trusted drivers, curated tours and premium
              last-minute experiences available now.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/experiences"
                className="rounded-xl bg-white px-6 py-4 text-black"
              >
                Browse Experiences
              </Link>

              <Link
                href="/partners"
                className="rounded-xl border border-white/50 px-6 py-4 text-white"
              >
                Become a Partner
              </Link>
            </div>

            {heroExperience ? (
              <div className="mt-10 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                Featured now: {heroExperience.title}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y bg-neutral-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3">
          <Trust
            title="Trusted Local Vendors"
            text="Verified operators and reliable local experiences."
          />
          <Trust
            title="Easy Booking"
            text="Simple, fast booking flow built for travelers."
          />
          <Trust
            title="Premium Selection"
            text="Only high-quality experiences worth your time."
          />
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/experiences?q=boat"
            className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium"
          >
            Boat Trips
          </Link>
          <Link
            href="/experiences?q=tour"
            className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium"
          >
            Island Tours
          </Link>
          <Link
            href="/experiences?q=driver"
            className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium"
          >
            Private Drivers
          </Link>
          <Link
            href="/experiences?q=sunset"
            className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium"
          >
            Sunset
          </Link>
          <Link
            href="/experiences?q=airport"
            className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium"
          >
            Airport Transfers
          </Link>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              Featured
            </p>

            <h2 className="mt-3 text-4xl font-semibold">
              Popular right now
            </h2>
          </div>

          <Link href="/experiences" className="text-sm font-medium">
            View all
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.map((item) => (
            <Link
              key={item.id}
              href={`/experiences/${item.slug}`}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={cover(item.id)}
                alt={item.title}
                className="h-64 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>

                <p className="mt-3 line-clamp-2 text-sm text-neutral-500">
                  {item.short_description}
                </p>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">From</p>

                    <p className="text-2xl font-semibold">
                      ${item.base_price}
                    </p>
                  </div>

                  <span className="rounded-xl bg-black px-4 py-2 text-sm text-white">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-4xl font-semibold">
            Own tours or transport in St Lucia?
          </h2>

          <p className="mt-4 max-w-2xl text-white/75">
            Join Lucia Now and receive high-intent travelers looking to book now.
          </p>

          <Link
            href="/partners"
            className="mt-8 inline-block rounded-xl bg-white px-6 py-4 text-black"
          >
            Become a Partner
          </Link>
        </div>
      </section>
    </main>
  );
}

function Trust({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-neutral-500">{text}</p>
    </div>
  );
}