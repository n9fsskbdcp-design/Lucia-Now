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
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{app.business_name}</h2>

                    <p className="mt-2 text-sm text-neutral-500">
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
                      <div className="mt-3 flex flex-wrap gap-2">
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
                      <p className="mt-4 text-sm text-neutral-700">{app.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
                      {app.status}
                    </span>

                    {app.status !== "approved" ? (
                      <form
                        action={`/api/admin/applications/${app.id}/approve`}
                        method="post"
                      >
                        <button className="rounded-xl bg-black px-5 py-3 text-white">
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