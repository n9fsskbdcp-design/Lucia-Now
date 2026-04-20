import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function HomePage() {
  const { data: items } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("featured_score", {
      ascending: false,
    })
    .limit(3);

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative min-h-[720px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          alt="St Lucia"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-6">
          <div className="max-w-3xl text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-white/80">
              St Lucia Experiences
            </p>

            <h1 className="mt-5 text-6xl font-semibold leading-tight">
              Book unforgettable island experiences.
            </h1>

            <p className="mt-6 max-w-2xl text-xl text-white/90">
              Luxury boat days, trusted drivers,
              curated tours and premium last-minute
              experiences available now.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/experiences"
                className="rounded-xl bg-white px-6 py-4 text-black"
              >
                Browse Experiences
              </Link>

              <Link
                href="/vendor/experiences"
                className="rounded-xl border border-white/50 px-6 py-4 text-white"
              >
                Become a Partner
              </Link>
            </div>
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

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              Featured
            </p>

            <h2 className="mt-3 text-4xl font-semibold">
              Popular right now
            </h2>
          </div>

          <Link
            href="/experiences"
            className="text-sm font-medium"
          >
            View all
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items?.map((item) => (
            <Link
              key={item.id}
              href={`/experiences/${item.slug}`}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                alt={item.title}
                className="h-64 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm text-neutral-500 line-clamp-2">
                  {item.short_description}
                </p>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">
                      From
                    </p>

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
            Join Lucia Now and receive high-intent
            travelers looking to book now.
          </p>

          <Link
            href="/vendor/experiences"
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
      <p className="mt-3 text-sm text-neutral-500">
        {text}
      </p>
    </div>
  );
}