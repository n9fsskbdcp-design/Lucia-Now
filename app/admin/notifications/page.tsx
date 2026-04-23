import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminNotificationsPage() {
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

  const { data: notifications } = await supabaseAdmin
    .from("notifications_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Admin</p>
            <h1 className="mt-2 text-4xl font-semibold">Notification Queue</h1>
          </div>

          <Link href="/admin" className="rounded-xl border px-5 py-3">
            Back to admin
          </Link>
        </div>

        <div className="space-y-4">
          {(notifications ?? []).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{item.subject}</h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    {item.recipient_email}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Type: {item.type}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                    {item.status}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <pre className="mt-4 overflow-x-auto rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-700">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}