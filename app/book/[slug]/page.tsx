import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function BookPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await props.params;

  const { data: item } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!item) notFound();

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm text-neutral-500">
          Booking Request
        </p>

        <h1 className="mt-3 text-5xl font-semibold">
          {item.title}
        </h1>

        <p className="mt-5 text-lg text-neutral-600">
          Booking flow is being finalised.
          Submit interest now and secure your spot.
        </p>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm text-neutral-500">
            Starting from
          </p>

          <p className="mt-2 text-4xl font-semibold">
            ${item.base_price}
          </p>

          <button className="mt-8 w-full rounded-xl bg-black py-4 text-white">
            Request Reservation
          </button>
        </div>

        <Link
          href="/experiences"
          className="mt-8 inline-block text-sm"
        >
          ← Back to experiences
        </Link>
      </section>
    </main>
  );
}