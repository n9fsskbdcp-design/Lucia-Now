import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ListChecks,
  Plus,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type SlotRow = {
  id: string;
  experience_id: string;
  status: string;
  starts_at: string;
  ends_at?: string;
};

type BlackoutRow = {
  id: string;
  experience_id: string;
  starts_at: string;
  ends_at: string;
};

function isBlocked(slot: SlotRow, blackouts: BlackoutRow[]) {
  const slotStart = new Date(slot.starts_at).getTime();
  const slotEnd = new Date(slot.ends_at ?? slot.starts_at).getTime();

  return blackouts.some((blackout) => {
    if (blackout.experience_id !== slot.experience_id) return false;

    const blackoutStart = new Date(blackout.starts_at).getTime();
    const blackoutEnd = new Date(blackout.ends_at).getTime();

    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

function statusLabel(contactStatus?: string | null, paymentStatus?: string | null) {
  if (contactStatus === "new") return "New";
  if (contactStatus === "contacted") return "Contacted";
  if (contactStatus === "confirmed_pending_payment") return "Awaiting payment";
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "Paid & confirmed";
  }
  if (contactStatus === "declined") return "Declined";
  if (contactStatus === "cancelled") return "Cancelled";
  if (contactStatus === "expired") return "Expired";

  return contactStatus || "New";
}

function badgeClass(contactStatus?: string | null, paymentStatus?: string | null) {
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

  if (contactStatus === "confirmed_pending_payment") {
    return "bg-amber-100 text-amber-800";
  }

  if (contactStatus === "contacted") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-neutral-100 text-neutral-700";
}

function statusIcon(contactStatus?: string | null, paymentStatus?: string | null) {
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return <CheckCircle2 size={14} />;
  }

  if (
    contactStatus === "declined" ||
    contactStatus === "cancelled" ||
    contactStatus === "expired"
  ) {
    return <XCircle size={14} />;
  }

  if (contactStatus === "confirmed_pending_payment") {
    return <CreditCard size={14} />;
  }

  return <Clock size={14} />;
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

export default async function VendorPage(props: {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") redirect("/");

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!vendor) redirect("/partners/status");

  const { data: experiences } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("vendor_id", vendor.id);

  const experienceIds = (experiences ?? []).map((item) => item.id);
  const safeIds = experienceIds.length
    ? experienceIds
    : ["00000000-0000-0000-0000-000000000000"];

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
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const { data: slotsData } = await supabaseAdmin
    .from("availability_slots")
    .select("id, experience_id, status, starts_at, ends_at")
    .in("experience_id", safeIds);

  const { data: blackoutData } = await supabaseAdmin
    .from("availability_blackouts")
    .select("id, experience_id, starts_at, ends_at")
    .in("experience_id", safeIds);

  const slots = (slotsData ?? []) as SlotRow[];
  const blackouts = (blackoutData ?? []) as BlackoutRow[];
  const visibleSlots = slots.filter((slot) => !isBlocked(slot, blackouts));

  const allLeads = requests ?? [];
  const leads = allLeads.filter((lead) => !lead.archived_by_vendor);
  const archivedLeads = allLeads.filter((lead) => lead.archived_by_vendor);

  const newLeads = leads.filter((lead) => lead.contact_status === "new");
  const contactedLeads = leads.filter((lead) => lead.contact_status === "contacted");
  const awaitingPaymentLeads = leads.filter(
    (lead) => lead.contact_status === "confirmed_pending_payment",
  );
  const confirmedLeads = leads.filter(
    (lead) =>
      lead.contact_status === "paid_confirmed" && lead.payment_status === "paid",
  );
  const closedLeads = leads.filter(
    (lead) =>
      lead.contact_status === "declined" ||
      lead.contact_status === "cancelled" ||
      lead.contact_status === "expired",
  );

  const liveCount = (experiences ?? []).filter(
    (item) => item.status === "published" && item.is_active,
  ).length;

  const openSlotsCount = visibleSlots.filter(
    (slot) => slot.status === "open",
  ).length;

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
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

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Partner workspace</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {vendor.business_name || "Vendor dashboard"}
              </h1>
              <p className="mt-2 text-sm text-white/65 sm:text-base">
                Manage active leads, confirmed bookings, and archived records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/vendor/experiences"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 font-medium text-neutral-950"
              >
                <ListChecks className="mr-2" size={18} />
                Experiences
              </Link>
              <Link
                href="/vendor/experiences/new"
                className="inline-flex items-center rounded-full bg-white/10 px-5 py-3 font-medium text-white ring-1 ring-white/15"
              >
                <Plus className="mr-2" size={18} />
                Add
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Sparkles size={18} />} label="Live experiences" value={liveCount} />
          <Metric icon={<ListChecks size={18} />} label="Active leads" value={leads.length} />
          <Metric
            icon={<ListChecks size={18} />}
            label="New leads"
            value={newLeads.length}
            highlight={newLeads.length > 0}
          />
          <Metric icon={<Archive size={18} />} label="Archived" value={archivedLeads.length} />
          <Metric icon={<CalendarDays size={18} />} label="Open slots" value={openSlotsCount} />
          <Metric
            icon={<CreditCard size={18} />}
            label="Awaiting payment"
            value={awaitingPaymentLeads.length}
            highlight={awaitingPaymentLeads.length > 0}
          />
          <Metric icon={<CheckCircle2 size={18} />} label="Confirmed" value={confirmedLeads.length} />
          <Metric icon={<XCircle size={18} />} label="Closed" value={closedLeads.length} />
        </div>

        <nav className="sticky top-16 z-20 mt-6 flex gap-2 overflow-x-auto rounded-[2rem] bg-white/95 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <Jump href="#new-leads" label={`New (${newLeads.length})`} />
          <Jump href="#contacted-leads" label={`Contacted (${contactedLeads.length})`} />
          <Jump href="#awaiting-payment" label={`Awaiting payment (${awaitingPaymentLeads.length})`} />
          <Jump href="#confirmed-leads" label={`Confirmed (${confirmedLeads.length})`} />
          <Jump href="#closed-leads" label={`Closed (${closedLeads.length})`} />
          <Jump href="#archived-leads" label={`Archived (${archivedLeads.length})`} />
        </nav>

        <LeadSection
          id="new-leads"
          eyebrow="Leads"
          title="New booking requests"
          subtitle="Requests waiting for your review."
          emptyTitle="No new leads"
          emptyBody="New traveler requests will appear here."
          leads={newLeads}
        />

        <LeadSection
          id="contacted-leads"
          eyebrow="Leads"
          title="Contacted"
          subtitle="Requests you have reviewed or followed up on."
          emptyTitle="No contacted leads"
          emptyBody="Leads marked contacted will appear here."
          leads={contactedLeads}
        />

        <LeadSection
          id="awaiting-payment"
          eyebrow="Leads"
          title="Awaiting payment"
          subtitle="Accepted requests waiting for the traveler to pay."
          emptyTitle="No leads awaiting payment"
          emptyBody="Accepted unpaid requests will appear here."
          leads={awaitingPaymentLeads}
          dark={awaitingPaymentLeads.length > 0}
        />

        <LeadSection
          id="confirmed-leads"
          eyebrow="Bookings"
          title="Confirmed bookings"
          subtitle="Paid and secured bookings."
          emptyTitle="No confirmed bookings"
          emptyBody="Paid bookings will appear here."
          leads={confirmedLeads}
        />

        <LeadSection
          id="closed-leads"
          eyebrow="Archive-ready"
          title="Closed requests"
          subtitle="Declined, cancelled, or expired requests. Archive these to clean up the main dashboard."
          emptyTitle="No closed requests"
          emptyBody="Declined, cancelled, or expired requests will appear here."
          leads={closedLeads}
        />

        <LeadSection
          id="archived-leads"
          eyebrow="Archive"
          title="Archived leads"
          subtitle="Hidden from the main dashboard but kept for your records."
          emptyTitle="No archived leads"
          emptyBody="Archived leads will appear here."
          leads={archivedLeads}
          archived
        />
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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
      <p className="mt-1 text-2xl font-semibold">{value}</p>
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

function LeadSection({
  id,
  eyebrow,
  title,
  subtitle,
  emptyTitle,
  emptyBody,
  leads,
  dark = false,
  archived = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  leads: any[];
  dark?: boolean;
  archived?: boolean;
}) {
  return (
    <section
      id={id}
      className={`mt-6 scroll-mt-28 rounded-[2rem] p-4 shadow-sm ring-1 sm:p-6 ${
        dark
          ? "bg-neutral-950 text-white ring-neutral-950"
          : "bg-white ring-black/5"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={dark ? "text-sm text-white/55" : "text-sm text-neutral-500"}>
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2>
          <p className={dark ? "mt-1 text-sm text-white/60" : "mt-1 text-sm text-neutral-500"}>
            {subtitle}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            dark ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {leads.length}
        </span>
      </div>

      {leads.length === 0 ? (
        <div
          className={`mt-4 rounded-2xl p-5 text-center ${
            dark ? "bg-white/10 text-white/65" : "bg-neutral-50 text-neutral-500"
          }`}
        >
          <p className="font-medium">{emptyTitle}</p>
          <p className="mt-1 text-sm">{emptyBody}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {leads.map((request) => (
            <LeadRow
              key={request.id}
              request={request}
              dark={dark}
              archived={archived}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LeadRow({
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
      className={`grid gap-3 rounded-2xl p-4 transition md:grid-cols-[1.5fr_1fr_auto] md:items-center ${
        dark
          ? "bg-white/10 text-white ring-1 ring-white/10"
          : "bg-neutral-50 hover:bg-neutral-100"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/vendor/leads/${request.id}`}
            className="truncate text-sm font-semibold hover:text-orange-600"
          >
            {request.experiences?.title || "Experience"}
          </Link>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(
              request.contact_status,
              request.payment_status,
            )}`}
          >
            {statusIcon(request.contact_status, request.payment_status)}
            {statusLabel(request.contact_status, request.payment_status)}
          </span>
        </div>

        <div
          className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${
            dark ? "text-white/65" : "text-neutral-500"
          }`}
        >
          <span>{request.guest_name || "Traveler"}</span>
          <span>
            {request.guests || 1} guest{request.guests === 1 ? "" : "s"}
          </span>
          {requestedTime ? <span>{requestedTime}</span> : null}
        </div>
      </div>

      <div className={`text-xs ${dark ? "text-white/65" : "text-neutral-500"}`}>
        <div className={dark ? "text-white" : "text-neutral-900"}>
          {request.guest_email || request.email || "No email shown"}
        </div>
        <div>{request.guest_phone || request.phone || "No phone shown"}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <Link
          href={`/vendor/leads/${request.id}`}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            dark
              ? "bg-white text-neutral-950"
              : "bg-white text-neutral-800 shadow-sm ring-1 ring-black/5"
          }`}
        >
          Open
        </Link>

        {archiveAllowed ? (
          <form
            action={
              archived
                ? `/api/bookings/${request.id}/unarchive`
                : `/api/bookings/${request.id}/archive`
            }
            method="post"
          >
            <button
              type="submit"
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                dark
                  ? "bg-white/10 text-white ring-1 ring-white/15"
                  : "bg-white text-neutral-700 shadow-sm ring-1 ring-black/5"
              }`}
            >
              {archived ? (
                <>
                  <RotateCcw className="mr-1.5" size={14} />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="mr-1.5" size={14} />
                  Archive
                </>
              )}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}