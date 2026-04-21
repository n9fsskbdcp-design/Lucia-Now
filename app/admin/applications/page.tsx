import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminApplicationsPage() {
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

  const { data: applications } = await supabaseAdmin
    .from("vendor_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-neutral-500">Admin</p>
        <h1 className="mt-3 text-4xl font-semibold">Partner Applications</h1>

        <div className="mt-10 space-y-4">
          {applications?.length ? (
            applications.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">{app.business_name}</h2>
                      <StatusBadge status={app.status} />
                    </div>

                    <p className="mt-3 text-sm text-neutral-500">
                      {app.full_name} · {app.email}
                    </p>

                    {app.phone ? (
                      <p className="mt-1 text-sm text-neutral-500">{app.phone}</p>
                    ) : null}

                    {app.website ? (
                      <p className="mt-1 text-sm text-neutral-500">{app.website}</p>
                    ) : null}

                    {app.instagram ? (
                      <p className="mt-1 text-sm text-neutral-500">{app.instagram}</p>
                    ) : null}

                    {app.experience_types?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {app.experience_types.map((type: string) => (
                          <span
                            key={type}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {app.notes ? (
                      <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
                        {app.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col gap-3 lg:w-64">
                    <form
                      action={`/api/admin/applications/${app.id}/status`}
                      method="post"
                    >
                      <input type="hidden" name="status" value="reviewing" />
                      <button className="w-full rounded-xl border px-4 py-3">
                        Mark Reviewing
                      </button>
                    </form>

                    <form
                      action={`/api/admin/applications/${app.id}/status`}
                      method="post"
                    >
                      <input type="hidden" name="status" value="rejected" />
                      <button className="w-full rounded-xl border px-4 py-3 text-red-600">
                        Reject
                      </button>
                    </form>

                    {app.status !== "approved" ? (
                      <form
                        action={`/api/admin/applications/${app.id}/approve`}
                        method="post"
                      >
                        <button className="w-full rounded-xl bg-black px-4 py-3 text-white">
                          Approve & Create Vendor
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white p-8 shadow-sm text-neutral-500">
              No partner applications yet.
            </div>
          )}
        </div>
      </section>
    </main>
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
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || "bg-neutral-100 text-neutral-700"}`}>
      {status}
    </span>
  );
}