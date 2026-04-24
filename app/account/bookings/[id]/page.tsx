import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";

function headline(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "confirmed_pending_payment") {
    return "Your request was accepted. Payment is needed to secure it.";
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "Your booking is paid and confirmed.";
  }

  if (contactStatus === "declined") {
    return "This request was declined.";
  }

  if (contactStatus === "contacted") {
    return "The vendor has contacted you or reviewed your request.";
  }

  return "Your request has been sent.";
}

export default async function AccountBookingDetailPage(
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

  const { data: request } = await supabaseAdmin
    .from("booking_requests")
    .select(
      `
      *,
      experiences (
        title,
        slug
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) notFound();

  const { data: messages } = await supabaseAdmin
    .from("booking_messages")
    .select("*")
    .eq("booking_request_id", id)
    .order("created_at", { ascending: true });

  const timeline = [
    { label: "Request sent", active: true },
    {
      label: "Vendor accepted",
      active: ["confirmed_pending_payment", "paid_confirmed"].includes(
        request.contact_status,
      ),
    },
    {
      label: "Payment completed",
      active: request.payment_status === "paid",
    },
    {
      label: "Booking secured",
      active:
        request.contact_status === "paid_confirmed" &&
        request.payment_status === "paid",
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Booking detail</p>
            <h1 className="mt-2 text-4xl font-semibold">
              {request.experiences?.title || "Booking"}
            </h1>
          </div>

          <Link href="/account" className="rounded-xl border px-5 py-3">
            Back to account
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">
            Current status
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            {headline(request.contact_status, request.payment_status)}
          </h2>

          {request.contact_status === "confirmed_pending_payment" ? (
            <Link
              href={`/account/bookings/${request.id}/pay`}
              className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-white"
            >
              Continue to payment
            </Link>
          ) : null}

          <h3 className="mt-10 text-xl font-semibold">Progress</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {timeline.map((step) => (
              <div
                key={step.label}
                className={`rounded-2xl p-4 ${
                  step.active
                    ? "bg-green-50 text-green-800"
                    : "bg-neutral-50 text-neutral-500"
                }`}
              >
                <p className="font-medium">{step.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3 text-neutral-700">
            <p>
              <strong>Guests:</strong> {request.guests}
            </p>

            <p>
              <strong>Payment:</strong> {request.payment_status}
            </p>

            {request.requested_start_at ? (
              <p>
                <strong>Requested slot:</strong>{" "}
                {new Date(request.requested_start_at).toLocaleString()}
              </p>
            ) : null}
          </div>

          {request.notes ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-medium">Your notes</p>
              <p className="mt-2 text-sm text-neutral-600">{request.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <MessageThread
            bookingId={request.id}
            messages={
              (messages ?? []) as {
                id: string;
                sender_role: string;
                message: string;
                created_at: string;
              }[]
            }
            compact
          />
        </div>
      </section>
    </main>
  );
}