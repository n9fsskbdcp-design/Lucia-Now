import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";

function prettyStatus(label: string) {
  if (label === "new") return "New";
  if (label === "confirmed_pending_payment") return "Awaiting payment";
  if (label === "paid_confirmed") return "Paid & confirmed";
  if (label === "contacted") return "Contacted";
  if (label === "declined") return "Declined";
  if (label === "cancelled") return "Cancelled";
  return label;
}

function actionMessage(status: string, paymentStatus: string) {
  if (status === "confirmed_pending_payment") {
    return "Accepted. The traveler needs to complete payment before the booking is secured.";
  }

  if (status === "paid_confirmed" && paymentStatus === "paid") {
    return "Paid and confirmed. Inventory has been deducted.";
  }

  if (status === "declined") {
    return "This request has been declined.";
  }

  if (status === "cancelled") {
    return "This request has been cancelled.";
  }

  if (status === "contacted") {
    return "Marked as contacted. You can still accept for payment or decline.";
  }

  return "Review the request, message the traveler if needed, then accept or decline.";
}

function canMarkContacted(status: string, paymentStatus: string) {
  return paymentStatus !== "paid" && status === "new";
}

function canAccept(status: string, paymentStatus: string) {
  return paymentStatus !== "paid" && ["new", "contacted"].includes(status);
}

function canDecline(status: string, paymentStatus: string) {
  return (
    paymentStatus !== "paid" &&
    ["new", "contacted", "confirmed_pending_payment"].includes(status)
  );
}

function canCancel(status: string, paymentStatus: string) {
  return (
    paymentStatus !== "paid" &&
    ["new", "contacted", "confirmed_pending_payment"].includes(status)
  );
}

export default async function VendorLeadDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string;
    notes?: string;
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    redirect("/");
  }

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const { data: lead } = await supabaseAdmin
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
    .single();

  if (!lead) notFound();

  if (profile?.role !== "admin" && lead.vendor_id !== vendor?.id) {
    redirect("/vendor");
  }

  const { data: messages } = await supabaseAdmin
    .from("booking_messages")
    .select("*")
    .eq("booking_request_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/vendor"
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to leads
        </Link>

        {searchParams.updated ? (
          <div className="mb-4 rounded-3xl bg-green-50 p-4 text-sm text-green-800">
            Lead updated: {prettyStatus(searchParams.updated)}
          </div>
        ) : null}

        {searchParams.cancelled ? (
          <div className="mb-4 rounded-3xl bg-green-50 p-4 text-sm text-green-800">
            Booking request cancelled.
          </div>
        ) : null}

        {searchParams.notes === "saved" ? (
          <div className="mb-4 rounded-3xl bg-green-50 p-4 text-sm text-green-800">
            Vendor notes saved.
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="mb-4 rounded-3xl bg-red-50 p-4 text-sm text-red-700">
            {searchParams.error}
          </div>
        ) : null}

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Lead detail</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {lead.experiences?.title || "Booking lead"}
          </h1>
          <p className="mt-3 text-white/70">
            {actionMessage(lead.contact_status, lead.payment_status)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/messages/${lead.id}`}
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950"
            >
              <MessageCircle className="mr-2" size={17} />
              Message traveler
            </Link>

            {lead.experiences?.slug ? (
              <Link
                href={`/experiences/${lead.experiences.slug}`}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15"
              >
                Public page
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
            <h2 className="text-2xl font-semibold">Traveler</h2>

            <div className="mt-6 grid gap-3">
              <Info label="Name" value={lead.guest_name} />
              <Info label="Email" value={lead.guest_email} />
              <Info label="Guests" value={String(lead.guests)} />
            </div>

            {lead.notes ? (
              <div className="mt-4 rounded-3xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Guest notes
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  {lead.notes}
                </p>
              </div>
            ) : null}

            {canMarkContacted(lead.contact_status, lead.payment_status) ? (
              <div className="mt-5">
                <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                  <input type="hidden" name="contact_status" value="contacted" />
                  <button className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-800">
                    Mark contacted
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
            <h2 className="text-2xl font-semibold">Decision</h2>

            <div className="mt-6 grid gap-3">
              <Info label="Status" value={prettyStatus(lead.contact_status)} />
              <Info label="Payment" value={lead.payment_status} />

              {lead.requested_start_at ? (
                <Info
                  label="Requested time"
                  value={new Date(lead.requested_start_at).toLocaleString()}
                />
              ) : null}
            </div>

            <div className="mt-6 rounded-3xl bg-neutral-50 p-4">
              <p className="text-sm leading-6 text-neutral-600">
                Accepting sends the traveler to payment. Inventory is reduced only after payment.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {canAccept(lead.contact_status, lead.payment_status) ? (
                  <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                    <input
                      type="hidden"
                      name="contact_status"
                      value="confirmed_pending_payment"
                    />
                    <button className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white">
                      Accept & request payment
                    </button>
                  </form>
                ) : null}

                {canDecline(lead.contact_status, lead.payment_status) ? (
                  <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                    <input type="hidden" name="contact_status" value="declined" />
                    <button className="rounded-full bg-white px-5 py-3 text-sm font-medium text-red-600 shadow-sm ring-1 ring-black/5">
                      Decline
                    </button>
                  </form>
                ) : null}

                {canCancel(lead.contact_status, lead.payment_status) ? (
                  <form action={`/api/bookings/${lead.id}/cancel`} method="post">
                    <button className="rounded-full bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
                      Cancel request
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <form
              action={`/api/vendor/leads/${lead.id}/notes`}
              method="post"
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-medium">
                Internal notes
              </label>

              <textarea
                name="vendor_notes"
                defaultValue={lead.vendor_notes || ""}
                rows={5}
                className="w-full rounded-3xl border px-4 py-3 text-sm"
                placeholder="Only visible to you..."
              />

              <button className="mt-3 rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-800">
                Save notes
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6">
          <MessageThread
            bookingId={lead.id}
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
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}