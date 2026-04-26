import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import BookingProgress from "@/components/booking/booking-progress";
import {
  canTouristCancel,
  getBookingStatusDescription,
  getBookingStatusLabel,
  isAwaitingPayment,
} from "@/lib/bookings/status";

function formatDate(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AccountBookingDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    cancelled?: string;
  }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

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

  const requestedTime = formatDate(request.requested_start_at);
  const statusLabel = getBookingStatusLabel({
    contactStatus: request.contact_status,
    paymentStatus: request.payment_status,
  });

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

        {searchParams.cancelled ? (
          <div className="mb-4 rounded-3xl bg-green-50 p-4 text-sm text-green-800">
            Booking request cancelled.
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="mb-4 rounded-3xl bg-red-50 p-4 text-sm text-red-700">
            {searchParams.error}
          </div>
        ) : null}

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-white/55">Booking request</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                {request.experiences?.title || "Booking"}
              </h1>
              <p className="mt-3 max-w-2xl text-white/70">
                {getBookingStatusDescription({
                  contactStatus: request.contact_status,
                  paymentStatus: request.payment_status,
                  viewer: "tourist",
                })}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-neutral-950">
              <BookingStatusBadge
                contactStatus={request.contact_status}
                paymentStatus={request.payment_status}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isAwaitingPayment({ contactStatus: request.contact_status }) ? (
              <Link
                href={`/account/bookings/${request.id}/pay`}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950"
              >
                Continue to payment
              </Link>
            ) : null}

            <Link
              href={`/messages/${request.id}`}
              className="inline-flex rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15"
            >
              <MessageCircle className="mr-2" size={17} />
              Message partner
            </Link>

            {canTouristCancel({
              contactStatus: request.contact_status,
              paymentStatus: request.payment_status,
            }) ? (
              <form action={`/api/bookings/${request.id}/cancel`} method="post">
                <button className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15">
                  Cancel request
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Current status</p>
              <h2 className="mt-1 text-2xl font-semibold">{statusLabel}</h2>
            </div>

            <BookingStatusBadge
              contactStatus={request.contact_status}
              paymentStatus={request.payment_status}
            />
          </div>

          <div className="mt-6">
            <BookingProgress
              contactStatus={request.contact_status}
              paymentStatus={request.payment_status}
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Info label="Guests" value={String(request.guests)} />
            <Info label="Payment" value={request.payment_status} />
            <Info label="Status" value={statusLabel} />
          </div>

          {requestedTime ? (
            <div className="mt-3 rounded-3xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Requested time
              </p>
              <p className="mt-1 font-medium">{requestedTime}</p>
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