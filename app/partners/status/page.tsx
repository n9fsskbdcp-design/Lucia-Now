import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function PartnerStatusPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/partners/status");
  }

  const { data: applications } = await supabaseAdmin
    .from("vendor_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const latest = applications?.[0] ?? null;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Partner Status
        </p>

        <h1 className="mt-4 text-4xl font-semibold">
          Your partner application
        </h1>

        {!latest ? (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-neutral-600">
              You have not submitted a partner application yet.
            </p>

            <a
              href="/partners"
              className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-white"
            >
              Apply now
            </a>
          </div>
        ) : (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
            <StatusBadge status={latest.status} />

            <h2 className="mt-6 text-2xl font-semibold">
              {latest.business_name}
            </h2>

            <p className="mt-3 text-neutral-600">
              Submitted by {latest.full_name}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <InfoCard label="Email" value={latest.email} />
              <InfoCard label="Phone" value={latest.phone || "—"} />
              <InfoCard label="Website" value={latest.website || "—"} />
              <InfoCard label="Instagram" value={latest.instagram || "—"} />
            </div>

            {latest.experience_types?.length ? (
              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-neutral-700">
                  Experience types
                </p>

                <div className="flex flex-wrap gap-2">
                  {latest.experience_types.map((type: string) => (
                    <span
                      key={type}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {latest.notes ? (
              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-neutral-700">
                  Notes
                </p>

                <p className="rounded-2xl bg-neutral-50 p-4 text-neutral-700">
                  {latest.notes}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    reviewing: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-medium ${styles[status] || "bg-neutral-100 text-neutral-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}