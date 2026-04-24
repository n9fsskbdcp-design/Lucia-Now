import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "tourist";

  let query = supabaseAdmin
    .from("app_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    query = query.eq("vendor_id", vendor?.id || "00000000-0000-0000-0000-000000000000");
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data: notifications } = await query;

  const unreadIds = (notifications ?? [])
    .filter((item) => item.read_at === null)
    .map((item) => item.id);

  if (unreadIds.length > 0) {
    await supabaseAdmin
      .from("app_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-semibold">Notifications</h1>
        <p className="mt-3 text-neutral-600">
          Platform updates about bookings, payments, and messages.
        </p>

        <div className="mt-10 space-y-4">
          {(notifications ?? []).length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-neutral-500 shadow-sm">
              No notifications yet.
            </div>
          ) : (
            (notifications ?? []).map((item) => (
              <Link
                key={item.id}
                href={item.href || "/notifications"}
                className="block rounded-3xl bg-white p-6 shadow-sm transition hover:bg-neutral-100"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">{item.title}</h2>

                      {!item.read_at ? (
                        <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                          New
                        </span>
                      ) : null}
                    </div>

                    {item.body ? (
                      <p className="mt-2 text-sm text-neutral-600">{item.body}</p>
                    ) : null}
                  </div>

                  <p className="text-xs text-neutral-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}