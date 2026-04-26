import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  User,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function prettyStatus(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "new") return "Request sent";
  if (contactStatus === "confirmed_pending_payment") return "Awaiting payment";
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "Paid & confirmed";
  }
  if (contactStatus === "contacted") return "Reviewed";
  if (contactStatus === "declined") return "Declined";
  if (contactStatus === "cancelled") return "Cancelled";
  return contactStatus;
}

function statusClass(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "confirmed_pending_payment") {
    return "bg-amber-100 text-amber-800";
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "bg-green-100 text-green-800";
  }

  if (["declined", "cancelled"].includes(contactStatus)) {
    return "bg-red-100 text-red-800";
  }

  if (contactStatus === "contacted") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-neutral-100 text-neutral-700";
}

function statusIcon(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "confirmed_pending_payment") {
    return <CreditCard size={18} />;
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return <CheckCircle2 size={18} />;
  }

  if (["declined", "cancelled"].includes(contactStatus)) {
    return <XCircle size={18} />;
  }

  if (contactStatus === "contacted") {
    return <AlertCircle size={18} />;
  }

  return <Clock size={18} />;
}

function formatDate(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AccountPage() {
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

  const bookings = requests ?? [];

  const awaitingPayment = bookings.filter(
    (item) => item.contact_status === "confirmed_pending_payment",
  );

  const activeBookings = bookings.filter((item) =>
    ["new", "contacted"].includes(item.contact_status),
  );

  const confirmedBookings = bookings.filter(
    (item) =>
      item.contact_status === "paid_confirmed" && item.payment_status === "paid",
  );

  const closedBookings = bookings.filter((item) =>
    ["declined", "cancelled"].includes(item.contact_status),
  );

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-sm text-neutral-500">Traveler account</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Your trips and requests
              </h1>
              <p className="mt-2 max-w-2xl text-neutral-600">
                Track booking requests, payment prompts, confirmations, and messages in one place.
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<User size={20} />}
            label="Signed in as"
            value={user.email || "Traveler"}
            small
          />
          <SummaryCard
            icon={<CalendarDays size={20} />}
            label="Total requests"
            value={String(bookings.length)}
          />
          <SummaryCard
            icon={<CreditCard size={20} />}
            label="Need payment"
            value={String(awaitingPayment.length)}
            highlight={awaitingPayment.length > 0}
          />
          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="Confirmed"
            value={String(confirmedBookings.length)}
          />
        </div>

        {awaitingPayment.length > 0 ? (
          <section className="mt-6 rounded-[2rem] bg-neutral-950 p-5 text-white shadow-xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-white/55">Action needed</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Complete payment to secure your booking
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {awaitingPayment.map((request) => (
                <BookingCard key={request.id} request={request} dark />
              ))}
            </div>
          </section>
        ) : null}

        <BookingSection
          title="Active requests"
          subtitle="Requests waiting for partner review or follow-up."
          emptyTitle="No active requests"
          emptyBody="New booking requests will appear here."
          bookings={activeBookings}
        />

        <BookingSection
          title="Confirmed bookings"
          subtitle="Paid and secured experiences."
          emptyTitle="No confirmed bookings yet"
          emptyBody="Once payment is completed, confirmed bookings will appear here."
          bookings={confirmedBookings}
        />

        <BookingSection
          title="Closed requests"
          subtitle="Declined or cancelled requests."
          emptyTitle="No closed requests"
          emptyBody="Cancelled or declined requests will appear here."
          bookings={closedBookings}
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
      className={`rounded-3xl p-5 shadow-sm ring-1 ring-black/5 ${
        highlight ? "bg-amber-50" : "bg-white"
      }`}
    >
      <div className="text-neutral-500">{icon}</div>
      <p className="mt-4 text-sm text-neutral-500">{label}</p>
      <p
        className={`mt-1 font-semibold ${
          small ? "truncate text-base" : "text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BookingSection({
  title,
  subtitle,
  emptyTitle,
  emptyBody,
  bookings,
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  bookings: any[];
}) {
  return (
    <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
      <div>
        <p className="text-sm text-neutral-500">Bookings</p>
        <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-neutral-50 p-8 text-center">
          <p className="font-medium">{emptyTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">{emptyBody}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {bookings.map((request) => (
            <BookingCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingCard({
  request,
  dark = false,
}: {
  request: any;
  dark?: boolean;
}) {
  const requestedTime = formatDate(request.requested_start_at);

  return (
    <Link
      href={`/account/bookings/${request.id}`}
      className={`block rounded-3xl p-4 transition sm:p-5 ${
        dark
          ? "bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15"
          : "bg-neutral-50 hover:bg-neutral-100"
      }`}
    >
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
              {request.guests} guest{request.guests === 1 ? "" : "s"}
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

      {request.contact_status === "confirmed_pending_payment" ? (
        <p className={`mt-4 text-sm font-medium ${dark ? "text-white" : "text-neutral-950"}`}>
          Continue to payment →
        </p>
      ) : (
        <p className={`mt-4 text-sm font-medium ${dark ? "text-white" : "text-neutral-950"}`}>
          View details →
        </p>
      )}
    </Link>
  );
}