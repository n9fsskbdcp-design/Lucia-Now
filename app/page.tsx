import Link from "next/link";
import Container from "@/components/layout/container";

export default function HomePage() {
  return (
    <main>
      <section className="border-b bg-neutral-50 py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
              St Lucia Experiences
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Book trusted island experiences in the next 24–48 hours.
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-600">
              Lucia Now helps travelers discover and book high-quality boat trips,
              tours, transfers, and local experiences with speed and confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/experiences"
                className="rounded bg-black px-5 py-3 text-white"
              >
                Explore experiences
              </Link>

              <Link
                href="/auth/signup"
                className="rounded border px-5 py-3"
              >
                Create account
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Fast booking</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Find availability in the next 24–48 hours without back-and-forth.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Trusted vendors</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Curated local operators, transparent information, and safer checkout.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Built for island travel</h2>
              <p className="mt-2 text-sm text-neutral-600">
                From boat trips to private drivers, Lucia Now is designed for real
                Caribbean logistics.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}