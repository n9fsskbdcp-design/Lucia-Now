import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  ChevronLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";

function prettyStatus(label?: string | null) {
  if (label === "new") return "New";
  if (label === "confirmed_pending_payment") return "Awaiting payment";
  if (label === "paid_confirmed") return "Paid & confirmed";
  if (label === "contacted") return "Contacted";
  if (label === "declined") return "Declined";
  if (label === "cancelled") return "Cancelled";
  if (label === "expired") return "Expired";
  return label || "New";
}

function actionMessage(status?: string | null, paymentStatus?: string | null) {
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

  if (status === "expired") {
    return "This request has expired.";
  }

  if (status === "contacted") {
    return "Marked as contacted. You can still accept for payment or decline.";
  }

  return "Review the request, message the traveler if needed, then accept or decline.";
}

function canMarkContacted(status?: string | null, paymentStatus?: string | null) {
  return paymentStatus !== "paid" && status === "new";
}

function canAccept(status?: string | null, paymentStatus?: string | null) {
  return paymentStatus !== "paid" && (status === "new" || status === "contacted");
}

function canDecline(status?: string | null, paymentStatus?: string | null) {
  return (
    paymentStatus !== "paid" &&
    (status === "new" ||
      status === "contacted" ||
      status === "confirmed_pending_payment")
  );
}

function canCancel(status?: string | null, paymentStatus?: string | null) {
  return (
    paymentStatus !== "paid" &&
    (status === "new" ||
      status === "contacted" ||
      status === "confirmed_pending_payment")
  );
}

function canArchive(status?: string | null, paymentStatus?: string | null) {
  if (status === "declined") return true;
  if (status === "cancelled") return true;
  if (status === "expired") return true;
  if (status === "paid_confirmed" && paymentStatus === "paid") return true;

  return false;
}

function backHref(status?: string | null, paymentStatus?: string | null, archived?: boolean | null) {
  if (archived) return "/vendor#archived-leads";

  if (status === "new") return "/vendor#new-leads";
  if (status === "contacted") return "/vendor#contacted-leads";
  if (status === "confirmed_pending_payment") return "/vendor#awaiting-payment";
  if (status === "paid_confirmed" && paymentStatus === "paid") {
    return "/vendor#confirmed-leads";
  }
  if (status === "declined" || status === "cancelled" || status === "expired") {
    return "/vendor#closed-leads";
  }

  return "/vendor";
}

function statusClass(status?: string | null, paymentStatus?: string | null) {
  if (status === "paid_confirmed" && paymentStatus === "paid") {
    return "bg-green-100 text-green-800";
  }

  if (status === "confirmed_pending_payment") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "contacted") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "declined" || status === "cancelled" || status === "expired") {
    return "bg-red-100 text-red-800";
  }

  return "bg-neutral-100 text-neutral-700";
}

function statusIcon(status?: string | null, paymentStatus?: string | null) {
  if (status === "paid_confirmed" && paymentStatus === "paid") {
    return <CheckCircle2 size={15} />;
  }

  if (status === "confirmed_pending_payment") {
    return <CreditCard size={15} />;
  }

  if (status === "declined" || status === "cancelled" || status === "expired") {
    return <XCircle size={15} />;
  }

  return <Clock size={15} />;
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function VendorLeadDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string;
    notes?: string;
    error?: string;
    cancelled?: string;
    archived?: string;
    restored?: string;
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

  const archiveAllowed = canArchive(lead.contact_status, lead.payment_status);

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={backHref(
            lead.contact_status,
            lead.payment_status,
            lead.archived_by_vendor,
          )}
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to leads
        </Link>

        {searchParams.updated ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Lead updated: {prettyStatus(searchParams.updated)}
          </div>
        ) : null}

        {searchParams.cancelled ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Booking request cancelled.
          </div>
        ) : null}

        {searchParams.archived ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Lead moved to archive.
          </div>
        ) : null}

        {searchParams.restored ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Lead restored.
          </div>
        ) : null}

        {searchParams.notes === "saved" ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Vendor notes saved.
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.error}
          </div>
        ) : null}

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-white/55">Lead detail</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {lead.experiences?.title || "Booking lead"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                {actionMessage(lead.contact_status, lead.payment_status)}
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                lead.contact_status,
                lead.payment_status,
              )}`}
            >
              {statusIcon(lead.contact_status, lead.payment_status)}
              {prettyStatus(lead.contact_status)}
            </span>
          </div>

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

            {archiveAllowed ? (
              <form
                action={
                  lead.archived_by_vendor
                    ? `/api/bookings/${lead.id}/unarchive`
                    : `/api/bookings/${lead.id}/archive`
                }
                method="post"
              >
                <button className="inline-flex rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15">
                  {lead.archived_by_vendor ? (
                    <>
                      <RotateCcw className="mr-2" size={17} />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2" size={17} />
                      Archive
                    </>
                  )}
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
            <h2 className="text-2xl font-semibold">Traveler</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="Name" value={lead.guest_name || "Traveler"} />
              <Info label="Email" value={lead.guest_email || "Not provided"} />
              <Info label="Guests" value={String(lead.guests || 1)} />
              <Info
                label="Requested time"
                value={formatDate(lead.requested_start_at)}
              />
            </div>

            {lead.notes ? (
              <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="Status" value={prettyStatus(lead.contact_status)} />
              <Info label="Payment" value={lead.payment_status || "unpaid"} />
            </div>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
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
                rows={4}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
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
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}