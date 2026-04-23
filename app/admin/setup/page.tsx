import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminSetupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const adminCountResult = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const adminCount = adminCountResult.count ?? 0;

  if (profile?.role !== "admin" && adminCount > 0) {
    redirect("/");
  }

  async function makeMeAdmin() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const adminCountResult = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    const adminCount = adminCountResult.count ?? 0;

    if (adminCount > 0) return;

    await supabaseAdmin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-xl px-6 py-20">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm text-neutral-500">Admin Setup</p>

          <h1 className="mt-3 text-4xl font-semibold">
            Create first admin
          </h1>

          <p className="mt-4 text-neutral-600">
            This page only works while there are no admin users yet.
          </p>

          <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Current role:</strong> {profile?.role || "tourist"}
            </p>
            <p>
              <strong>Existing admins:</strong> {adminCount}
            </p>
          </div>

          <form action={makeMeAdmin} className="mt-8">
            <button className="w-full rounded-xl bg-black px-5 py-4 text-white">
              Make this account admin
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}