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
        <h1 className="mt-3 text-4xl font-semibold">Vendor Verification</h1>

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
                    Status: {vendor.verification_status}
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    Verified: {vendor.is_verified ? "Yes" : "No"}
                  </p>
                </div>

                {!vendor.is_verified ? (
                  <form
                    action={`/api/admin/vendors/${vendor.id}/verify`}
                    method="post"
                  >
                    <button className="rounded-xl bg-black px-5 py-3 text-white">
                      Approve Vendor
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}