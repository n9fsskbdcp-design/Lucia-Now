import Link from "next/link";

export default async function BookingSuccessPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await props.params;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-2xl px-6 py-24">
        <div className="rounded-3xl bg-white p-10 shadow-sm">
          <p className="text-sm text-green-700">
            Request Sent
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Your booking request has been submitted.
          </h1>

          <p className="mt-5 text-neutral-600">
            The vendor can now review your request and follow up with availability or next steps.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/experiences/${slug}`}
              className="rounded-xl border px-5 py-3"
            >
              Back to experience
            </Link>

            <Link
              href="/experiences"
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              Browse more experiences
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}