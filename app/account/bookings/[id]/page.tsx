import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";

function headline(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "confirmed_pending_payment") {
    return "Accepted — payment needed";
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "Paid and confirmed";
  }

  if (contactStatus === "declined") {
    return "Request declined";
  }

  if (contactStatus === "contacted") {
    return "Vendor reviewed your request";
  }

  return "Request sent";
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
    <main className="page-shell">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/account"
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to account
        </Link>

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Booking request</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {request.experiences?.title || "Booking"}
          </h1>
          <p className="mt-3 text-white/70">
            {headline(request.contact_status, request.payment_status)}
          </p>

          {request.contact_status === "confirmed_pending_payment" ? (
            <Link
              href={`/account/bookings/${request.id}/pay`}
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950"
            >
              Continue to payment
            </Link>
          ) : null}
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <h2 className="text-2xl font-semibold">Progress</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {timeline.map((step) => (
              <div
                key={step.label}
                className={`rounded-3xl p-4 ${
                  step.active
                    ? "bg-green-50 text-green-800"
                    : "bg-neutral-50 text-neutral-500"
                }`}
              >
                <p className="text-sm font-semibold">{step.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Info label="Guests" value={String(request.guests)} />
            <Info label="Payment" value={request.payment_status} />
            <Info
              label="Status"
              value={request.contact_status || request.status}
            />
          </div>

          {request.requested_start_at ? (
            <div className="mt-3 rounded-3xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Requested time
              </p>
              <p className="mt-1 font-medium">
                {new Date(request.requested_start_at).toLocaleString()}
              </p>
            </div>
          ) : null}

          {request.notes ? (
            <div className="mt-3 rounded-3xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Your notes
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {request.notes}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}