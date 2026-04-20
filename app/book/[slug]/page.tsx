import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BookingRequestForm from "@/components/booking/request-form";

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
          Submit your request and the vendor can follow up with details and availability.
        </p>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm text-neutral-500">
            Starting from
          </p>

          <p className="mt-2 text-4xl font-semibold">
            ${item.base_price}
          </p>

          <BookingRequestForm
            experienceId={item.id}
            slug={item.slug}
          />
        </div>

        <Link
          href={`/experiences/${item.slug}`}
          className="mt-8 inline-block text-sm"
        >
          ← Back to experience
        </Link>
      </section>
    </main>
  );
}