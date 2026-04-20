import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm text-neutral-500">Account</p>

        <h1 className="mt-3 text-4xl font-semibold">Welcome back</h1>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Profile</h2>

            <div className="mt-5 space-y-3 text-sm text-neutral-600">
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Name:</strong> {profile?.full_name || "—"}
              </p>
              <p>
                <strong>Role:</strong> {profile?.role || "tourist"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Bookings</h2>

            <p className="mt-5 text-sm text-neutral-500">
              Your upcoming and past bookings will appear here.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}