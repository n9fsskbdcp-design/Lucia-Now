import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function BookingPaymentPage(
  props: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: booking } = await supabaseAdmin
    .from("booking_requests")
    .select(
      `
      *,
      experiences (
        title,
        slug,
        base_price
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!booking) notFound();

  if (booking.contact_status !== "confirmed_pending_payment") {
    redirect(`/account/bookings/${booking.id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm text-neutral-500">Payment</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Complete your booking
        </h1>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {booking.experiences?.title || "Booking"}
          </h2>

          {booking.requested_start_at ? (
            <p className="mt-3 text-neutral-600">
              Slot: {new Date(booking.requested_start_at).toLocaleString()}
            </p>
          ) : null}

          <p className="mt-2 text-neutral-600">
            Guests: {booking.guests}
          </p>

          <div className="mt-8 rounded-2xl bg-neutral-50 p-5">
            <p className="text-sm text-neutral-500">Demo payment amount</p>
            <p className="mt-2 text-3xl font-semibold">
              ${booking.experiences?.base_price || 0}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              This is a placeholder payment step for the booking lifecycle.
            </p>
          </div>

          <form
            action={`/api/bookings/${booking.id}/pay`}
            method="post"
            className="mt-8"
          >
            <button className="w-full rounded-xl bg-black py-4 text-white">
              Mark as Paid
            </button>
          </form>
        </div>

        <Link
          href={`/account/bookings/${booking.id}`}
          className="mt-8 inline-block text-sm"
        >
          ← Back to booking
        </Link>
      </section>
    </main>
  );
}