import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function prettyStatus(contactStatus?: string | null, paymentStatus?: string | null) {
  if (contactStatus === "new") return "Request sent";
  if (contactStatus === "confirmed_pending_payment") return "Awaiting payment";
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "Paid & confirmed";
  }
  if (contactStatus === "contacted") return "Reviewed";
  if (contactStatus === "declined") return "Declined";
  if (contactStatus === "cancelled") return "Cancelled";
  if (contactStatus === "expired") return "Expired";

  return contactStatus || "Request sent";
}

function statusClass(contactStatus?: string | null, paymentStatus?: string | null) {
  if (contactStatus === "confirmed_pending_payment") {
    return "bg-amber-100 text-amber-800";
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "bg-green-100 text-green-800";
  }

  if (
    contactStatus === "declined" ||
    contactStatus === "cancelled" ||
    contactStatus === "expired"
  ) {
    return "bg-red-100 text-red-800";
  }

  if (contactStatus === "contacted") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-neutral-100 text-neutral-700";
}

function statusIcon(contactStatus?: string | null, paymentStatus?: string | null) {
  if (contactStatus === "confirmed_pending_payment") {
    return <CreditCard size={18} />;
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return <CheckCircle2 size={18} />;
  }

  if (
    contactStatus === "declined" ||
    contactStatus === "cancelled" ||
    contactStatus === "expired"
  ) {
    return <XCircle size={18} />;
  }

  if (contactStatus === "contacted") {
    return <AlertCircle size={18} />;
  }

  return <Clock size={18} />;
}

function canArchive(contactStatus?: string | null, paymentStatus?: string | null) {
  if (contactStatus === "declined") return true;
  if (contactStatus === "cancelled") return true;
  if (contactStatus === "expired") return true;
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") return true;

  return false;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AccountPage(props: {
  searchParams: Promise<{
    archived?: string;
    restored?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: requests } = await supabaseAdmin
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allBookings = requests ?? [];
  const bookings = allBookings.filter((item) => !item.archived_by_tourist);
  const archivedBookings = allBookings.filter((item) => item.archived_by_tourist);

  const awaitingPayment = bookings.filter(
    (item) => item.contact_status === "confirmed_pending_payment",
  );

  const newRequests = bookings.filter((item) => item.contact_status === "new");

  const contactedRequests = bookings.filter(
    (item) => item.contact_status === "contacted",
  );

  const confirmedBookings = bookings.filter(
    (item) =>
      item.contact_status === "paid_confirmed" && item.payment_status === "paid",
  );

  const closedBookings = bookings.filter(
    (item) =>
      item.contact_status === "declined" ||
      item.contact_status === "cancelled" ||
      item.contact_status === "expired",
  );

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {searchParams.archived ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Booking moved to archive.
          </div>
        ) : null}

        {searchParams.restored ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Booking restored.
          </div>
        ) : null}

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-sm text-neutral-500">Traveler account</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Your trips and requests
              </h1>
              <p className="mt-2 max-w-2xl text-neutral-600">
                Track active requests, payments, confirmations, and archived history.
              </p>
            </div>

            <Link
              href="/experiences"
              className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-3 font-medium text-white"
            >
              <Compass className="mr-2" size={18} />
              Browse experiences
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<User size={20} />}
            label="Signed in as"
            value={user.email || "Traveler"}
            small
          />
          <SummaryCard
            icon={<CalendarDays size={20} />}
            label="Active requests"
            value={String(bookings.length)}
          />
          <SummaryCard
            icon={<CreditCard size={20} />}
            label="Need payment"
            value={String(awaitingPayment.length)}
            highlight={awaitingPayment.length > 0}
          />
          <SummaryCard
            icon={<Archive size={20} />}
            label="Archived"
            value={String(archivedBookings.length)}
          />
        </div>

        <nav className="sticky top-16 z-20 mt-6 flex gap-2 overflow-x-auto rounded-[2rem] bg-white/95 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <Jump href="#awaiting-payment" label={`Payment (${awaitingPayment.length})`} />
          <Jump href="#new-requests" label={`New (${newRequests.length})`} />
          <Jump href="#reviewed" label={`Reviewed (${contactedRequests.length})`} />
          <Jump href="#confirmed" label={`Confirmed (${confirmedBookings.length})`} />
          <Jump href="#closed" label={`Closed (${closedBookings.length})`} />
          <Jump href="#archived" label={`Archived (${archivedBookings.length})`} />
        </nav>

        {awaitingPayment.length > 0 ? (
          <section
            id="awaiting-payment"
            className="mt-6 scroll-mt-28 rounded-[2rem] bg-neutral-950 p-5 text-white shadow-xl sm:p-8"
          >
            <p className="text-sm text-white/55">Action needed</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Complete payment to secure your booking
            </h2>

            <div className="mt-5 grid gap-3">
              {awaitingPayment.map((request) => (
                <BookingCard key={request.id} request={request} dark />
              ))}
            </div>
          </section>
        ) : (
          <EmptyAnchoredSection
            id="awaiting-payment"
            title="Payment"
            emptyTitle="No payments needed"
            emptyBody="Accepted bookings that need payment will appear here."
          />
        )}

        <BookingSection
          id="new-requests"
          title="New requests"
          subtitle="Requests waiting for partner review."
          emptyTitle="No new requests"
          emptyBody="New booking requests will appear here."
          bookings={newRequests}
        />

        <BookingSection
          id="reviewed"
          title="Reviewed requests"
          subtitle="Requests the partner has reviewed or contacted you about."
          emptyTitle="No reviewed requests"
          emptyBody="When a partner reviews your request, it will appear here."
          bookings={contactedRequests}
        />

        <BookingSection
          id="confirmed"
          title="Confirmed bookings"
          subtitle="Paid and secured experiences."
          emptyTitle="No confirmed bookings yet"
          emptyBody="Once payment is completed, confirmed bookings will appear here."
          bookings={confirmedBookings}
        />

        <BookingSection
          id="closed"
          title="Closed requests"
          subtitle="Declined, cancelled, or expired requests. You can archive these to clean up your dashboard."
          emptyTitle="No closed requests"
          emptyBody="Cancelled, declined, or expired requests will appear here."
          bookings={closedBookings}
        />

        <BookingSection
          id="archived"
          title="Archived history"
          subtitle="Hidden from your main dashboard, but kept for records."
          emptyTitle="No archived bookings"
          emptyBody="Archived bookings will appear here."
          bookings={archivedBookings}
          archived
        />
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  small = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ring-1 ring-black/5 ${
        highlight ? "bg-amber-50" : "bg-white"
      }`}
    >
      <div className="text-neutral-500">{icon}</div>
      <p className="mt-3 text-xs text-neutral-500">{label}</p>
      <p
        className={`mt-1 font-semibold ${
          small ? "truncate text-base" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Jump({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-full bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
    >
      {label}
    </Link>
  );
}

function EmptyAnchoredSection({
  id,
  title,
  emptyTitle,
  emptyBody,
}: {
  id: string;
  title: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <section
      id={id}
      className="mt-6 scroll-mt-28 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-6 rounded-3xl bg-neutral-50 p-8 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">{emptyBody}</p>
      </div>
    </section>
  );
}

function BookingSection({
  id,
  title,
  subtitle,
  emptyTitle,
  emptyBody,
  bookings,
  archived = false,
}: {
  id: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  bookings: any[];
  archived?: boolean;
}) {
  return (
    <section
      id={id}
      className="mt-6 scroll-mt-28 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500">Bookings</p>
          <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        </div>

        <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
          {bookings.length}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-neutral-50 p-8 text-center">
          <p className="font-medium">{emptyTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">{emptyBody}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {bookings.map((request) => (
            <BookingCard key={request.id} request={request} archived={archived} />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingCard({
  request,
  dark = false,
  archived = false,
}: {
  request: any;
  dark?: boolean;
  archived?: boolean;
}) {
  const requestedTime = formatDate(request.requested_start_at);
  const archiveAllowed = canArchive(request.contact_status, request.payment_status);

  return (
    <div
      className={`rounded-3xl p-4 transition sm:p-5 ${
        dark
          ? "bg-white/10 text-white ring-1 ring-white/10"
          : "bg-neutral-50"
      }`}
    >
      <Link href={`/account/bookings/${request.id}`} className="block">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">
              {request.experiences?.title || "Experience"}
            </h3>

            <div
              className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm ${
                dark ? "text-white/65" : "text-neutral-500"
              }`}
            >
              <span>
                {request.guests || 1} guest{request.guests === 1 ? "" : "s"}
              </span>

              {requestedTime ? <span>{requestedTime}</span> : null}
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
              request.contact_status,
              request.payment_status,
            )}`}
          >
            {statusIcon(request.contact_status, request.payment_status)}
            {prettyStatus(request.contact_status, request.payment_status)}
          </span>
        </div>

        <p
          className={`mt-4 text-sm font-medium ${
            dark ? "text-white" : "text-neutral-950"
          }`}
        >
          {request.contact_status === "confirmed_pending_payment"
            ? "Continue to payment →"
            : "View details →"}
        </p>
      </Link>

      {archiveAllowed ? (
        <form
          action={
            archived
              ? `/api/bookings/${request.id}/unarchive`
              : `/api/bookings/${request.id}/archive`
          }
          method="post"
          className="mt-4"
        >
          <button
            type="submit"
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
              dark
                ? "bg-white/10 text-white ring-1 ring-white/15"
                : "bg-white text-neutral-700 shadow-sm ring-1 ring-black/5"
            }`}
          >
            {archived ? (
              <>
                <RotateCcw className="mr-2" size={16} />
                Restore
              </>
            ) : (
              <>
                <Archive className="mr-2" size={16} />
                Archive
              </>
            )}
          </button>
        </form>
      ) : null}
    </div>
  );
}