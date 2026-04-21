import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function VendorPage() {
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

  const { data: bookingRequests } = await supabaseAdmin
    .from("booking_requests")
    .select("id, status, experience_id")
    .order("created_at", { ascending: false });

  const requests = (bookingRequests ?? []).filter((r) =>
    experienceIds.includes(r.experience_id),
  );

  const { data: slots } = await supabaseAdmin
    .from("availability_slots")
    .select("id, experience_id, status, starts_at")
    .in("experience_id", experienceIds.length ? experienceIds : ["00000000-0000-0000-0000-000000000000"]);

  const liveCount = (experiences ?? []).filter(
    (e) => e.status === "published" && e.is_active,
  ).length;

  const newLeadsCount = requests.filter((r) => r.status === "new").length;
  const openSlotsCount = (slots ?? []).filter((s) => s.status === "open").length;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm text-neutral-500">Vendor Dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <MetricCard label="Live Experiences" value={String(liveCount)} />
          <MetricCard label="Booking Leads" value={String(requests.length)} />
          <MetricCard label="New Leads" value={String(newLeadsCount)} />
          <MetricCard label="Open Slots" value={String(openSlotsCount)} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Manage Listings</h2>
            <p className="mt-3 text-neutral-600">
              Update pricing, images, descriptions and availability messaging.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/vendor/experiences"
                className="rounded-xl bg-black px-5 py-3 text-white"
              >
                Open Dashboard
              </Link>

              <Link
                href="/vendor/experiences/new"
                className="rounded-xl border px-5 py-3"
              >
                Add Experience
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Verification Status</h2>
            <p className="mt-3 text-neutral-600">
              This vendor account status controls public trust badges.
            </p>

            <div className="mt-6 space-y-2 text-sm text-neutral-700">
              <p>
                <strong>Business:</strong> {vendor.business_name}
              </p>
              <p>
                <strong>Verification:</strong> {vendor.verification_status}
              </p>
              <p>
                <strong>Verified badge:</strong> {vendor.is_verified ? "On" : "Off"}
              </p>
              <p>
                <strong>Live:</strong> {vendor.is_live ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">What availability affects</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard
              title="Experience cards"
              text="Cards can show slot counts and next available time."
            />
            <InfoCard
              title="Experience page"
              text="Guests can click real upcoming times from the listing page."
            />
            <InfoCard
              title="Booking flow"
              text="Booking requests can reduce remaining spots for a slot."
            />
          </div>
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

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-5">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600">{text}</p>
    </div>
  );
}