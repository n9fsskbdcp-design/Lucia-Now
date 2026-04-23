import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminLeadsPage() {
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

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: leads } = await supabaseAdmin
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
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Admin</p>
            <h1 className="mt-2 text-4xl font-semibold">All Leads</h1>
          </div>

          <Link href="/admin" className="rounded-xl border px-5 py-3">
            Back to admin
          </Link>
        </div>

        <div className="space-y-4">
          {(leads ?? []).map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {lead.experiences?.title || "Experience"}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    {lead.guest_name} · {lead.guest_email}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Guests: {lead.guests}
                  </p>
                  {lead.requested_start_at ? (
                    <p className="mt-1 text-sm text-neutral-500">
                      Requested slot: {new Date(lead.requested_start_at).toLocaleString()}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <StatusBadge label={lead.status} />
                  <StatusBadge label={lead.contact_status} subtle />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
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