import { redirect } from "next/navigation";
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    redirect("/");
  }

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (!vendor) {
    redirect("/vendor/experiences");
  }

  const { data: requests } = await supabaseAdmin
    .from("booking_requests")
    .select(
      `
      *,
      experiences (
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  const vendorExperienceIds =
    (
      await supabaseAdmin
        .from("experiences")
        .select("id")
        .eq("vendor_id", vendor.id)
    ).data?.map((e) => e.id) ?? [];

  const filtered = (requests ?? []).filter((r) =>
    vendorExperienceIds.includes(r.experience_id)
  );

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-neutral-500">Vendor</p>
        <h1 className="mt-3 text-4xl font-semibold">Booking Leads</h1>

        <div className="mt-10 space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-neutral-500">No booking requests yet.</p>
            </div>
          ) : (
            filtered.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {request.experiences?.title || "Experience"}
                    </h2>

                    <p className="mt-2 text-sm text-neutral-500">
                      {request.guest_name} · {request.guest_email}
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                      Guests: {request.guests}
                    </p>

                    {request.notes ? (
                      <p className="mt-3 text-sm text-neutral-700">
                        {request.notes}
                      </p>
                    ) : null}
                  </div>

                  <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
                    {request.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}