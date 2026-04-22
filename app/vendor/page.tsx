import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    redirect("/");
  }

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    redirect("/partners/status");
  }

  const { data: experiences } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("vendor_id", vendor.id);

  const experienceIds = (experiences ?? []).map((e) => e.id);

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

  const { data: slots } = await supabaseAdmin
    .from("availability_slots")
    .select("id, experience_id, status, starts_at")
    .in(
      "experience_id",
      experienceIds.length ? experienceIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const filteredRequests =
    selectedStatus === "all"
      ? requests ?? []
      : (requests ?? []).filter(
          (r) => r.status === selectedStatus || r.contact_status === selectedStatus,
        );

  const liveCount = (experiences ?? []).filter(
    (e) => e.status === "published" && e.is_active,
  ).length;

  const openSlotsCount = (slots ?? []).filter((s) => s.status === "open").length;
  const newLeadsCount = (requests ?? []).filter((r) => r.status === "new").length;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm text-neutral-500">Vendor</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/vendor/experiences"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Manage Experiences
          </Link>
          <Link
            href="/vendor/experiences/new"
            className="rounded-xl border px-5 py-3"
          >
            Add Experience
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <MetricCard label="Live Experiences" value={String(liveCount)} />
          <MetricCard label="Booking Leads" value={String(requests?.length || 0)} />
          <MetricCard label="New Leads" value={String(newLeadsCount)} />
          <MetricCard label="Open Slots" value={String(openSlotsCount)} />
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Recent booking leads</h2>

            <div className="flex flex-wrap gap-2 text-sm">
              <FilterLink label="All" value="all" current={selectedStatus} />
              <FilterLink label="New" value="new" current={selectedStatus} />
              <FilterLink label="Contacted" value="contacted" current={selectedStatus} />
              <FilterLink label="Confirmed" value="confirmed" current={selectedStatus} />
              <FilterLink label="Declined" value="declined" current={selectedStatus} />
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <p className="mt-6 text-neutral-500">No leads for this filter.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredRequests.slice(0, 12).map((request) => (
                <Link
                  key={request.id}
                  href={`/vendor/leads/${request.id}`}
                  className="block rounded-2xl bg-neutral-50 p-5 transition hover:bg-neutral-100"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {request.experiences?.title || "Experience"}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-500">
                        {request.guest_name} · {request.guest_email}
                      </p>

                      <p className="mt-1 text-sm text-neutral-500">
                        Guests: {request.guests}
                      </p>

                      {request.requested_start_at ? (
                        <p className="mt-1 text-sm text-neutral-500">
                          Requested slot:{" "}
                          {new Date(request.requested_start_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <StatusBadge label={request.status} />
                      <StatusBadge label={request.contact_status} subtle />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({
  label,
  subtle = false,
}: {
  label: string;
  subtle?: boolean;
}) {
  const base = subtle
    ? "bg-neutral-100 text-neutral-700"
    : label === "new"
      ? "bg-blue-100 text-blue-800"
      : label === "confirmed"
        ? "bg-green-100 text-green-800"
        : label === "declined"
          ? "bg-red-100 text-red-800"
          : "bg-neutral-100 text-neutral-700";

  return (
    <div className={`rounded-full px-3 py-1 text-xs font-medium ${base}`}>
      {label}
    </div>
  );
}

function FilterLink({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current: string;
}) {
  const active = value === current;

  return (
    <Link
      href={value === "all" ? "/vendor" : `/vendor?status=${value}`}
      className={`rounded-full px-4 py-2 ${active ? "bg-black text-white" : "bg-neutral-100 text-neutral-700"}`}
    >
      {label}
    </Link>
  );
}