import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminPage() {
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

  const { data: vendors } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-neutral-500">Admin</p>
        <h1 className="mt-3 text-4xl font-semibold">Vendor Controls</h1>

        <div className="mt-10 space-y-4">
          {vendors?.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {vendor.business_name}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    Verification: {vendor.verification_status}
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    Verified: {vendor.is_verified ? "Yes" : "No"}
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    Live: {vendor.is_live ? "Yes" : "No"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <form action={`/api/admin/vendors/${vendor.id}/toggle`} method="post">
                    <input type="hidden" name="field" value="is_verified" />
                    <button className="rounded-xl border px-5 py-3">
                      {vendor.is_verified ? "Remove verification" : "Verify vendor"}
                    </button>
                  </form>

                  <form action={`/api/admin/vendors/${vendor.id}/toggle`} method="post">
                    <input type="hidden" name="field" value="is_live" />
                    <button className="rounded-xl bg-black px-5 py-3 text-white">
                      {vendor.is_live ? "Set not live" : "Set live"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}