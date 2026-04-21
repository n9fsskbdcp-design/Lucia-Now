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

  const { data: bookingRequests } = await supabaseAdmin
    .from("booking_requests")
    .select("id, status, experience_id")
    .order("created_at", { ascending: false });

  const experienceIds = (experiences ?? []).map((e) => e.id);
  const requests = (bookingRequests ?? []).filter((r) =>
    experienceIds.includes(r.experience_id)
  );

  const liveCount = (experiences ?? []).filter(
    (e) => e.status === "published" && e.is_active,
  ).length;

  const newLeadsCount = requests.filter((r) => r.status === "new").length;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm text-neutral-500">Vendor Dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MetricCard label="Live Experiences" value={String(liveCount)} />
          <MetricCard label="Booking Leads" value={String(requests.length)} />
          <MetricCard label="New Leads" value={String(newLeadsCount)} />
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
            <h2 className="text-xl font-semibold">Partner Status</h2>
            <p className="mt-3 text-neutral-600">
              Your vendor account is verified and live on Lucia Now.
            </p>

            <div className="mt-6 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              Verified Partner
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Recent Booking Leads</h2>

          {requests.length === 0 ? (
            <p className="mt-4 text-neutral-500">No leads yet.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4"
                >
                  <p className="text-sm text-neutral-700">
                    Lead #{request.id.slice(0, 8)}
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs">
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/vendor"
            className="mt-6 inline-block text-sm font-medium underline"
          >
            Refresh leads
          </Link>
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