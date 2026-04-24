import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ListChecks, Plus, Sparkles } from "lucide-react";
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

function badgeClass(label: string) {
  if (label === "confirmed" || label === "paid_confirmed") return "bg-green-100 text-green-800";
  if (label === "declined") return "bg-red-100 text-red-800";
  if (label === "pending_payment" || label === "confirmed_pending_payment") return "bg-amber-100 text-amber-800";
  return "bg-neutral-100 text-neutral-700";
}

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const selectedStatus = params.status || "all";

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
  const leads = requests ?? [];

  const filtered =
    selectedStatus === "all"
      ? leads
      : leads.filter(
          (item) =>
            item.status === selectedStatus ||
            item.contact_status === selectedStatus,
        );

  const liveCount = (experiences ?? []).filter(
    (item) => item.status === "published" && item.is_active,
  ).length;

  const openSlotsCount = visibleSlots.filter((slot) => slot.status === "open").length;
  const newLeadsCount = leads.filter((lead) => lead.status === "new").length;

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Partner workspace</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                {vendor.business_name || "Vendor dashboard"}
              </h1>
              <p className="mt-2 text-white/65">
                Manage leads, availability, and listing performance.
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Sparkles size={20} />} label="Live experiences" value={liveCount} />
          <Metric icon={<ListChecks size={20} />} label="Booking leads" value={leads.length} />
          <Metric icon={<ListChecks size={20} />} label="New leads" value={newLeadsCount} />
          <Metric icon={<CalendarDays size={20} />} label="Open slots" value={openSlotsCount} />
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Leads</p>
              <h2 className="mt-1 text-2xl font-semibold">Booking requests</h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                ["All", "all"],
                ["New", "new"],
                ["Contacted", "contacted"],
                ["Awaiting payment", "confirmed_pending_payment"],
                ["Confirmed", "confirmed"],
                ["Declined", "declined"],
              ].map(([label, value]) => (
                <Link
                  key={value}
                  href={value === "all" ? "/vendor" : `/vendor?status=${value}`}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    selectedStatus === value
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-neutral-50 p-8 text-center text-neutral-500">
              No leads for this filter.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filtered.slice(0, 14).map((request) => (
                <Link
                  key={request.id}
                  href={`/vendor/leads/${request.id}`}
                  className="block rounded-3xl bg-neutral-50 p-4 transition hover:bg-neutral-100 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {request.experiences?.title || "Experience"}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-500">
                        {request.guest_name} · {request.guests} guest
                        {request.guests === 1 ? "" : "s"}
                      </p>

                      {request.requested_start_at ? (
                        <p className="mt-1 text-sm text-neutral-500">
                          {new Date(request.requested_start_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(request.contact_status)}`}>
                      {request.contact_status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="text-neutral-500">{icon}</div>
      <p className="mt-4 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}