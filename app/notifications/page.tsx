import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MarkNotificationsReadRefresh from "@/components/notifications/mark-notifications-read-refresh";

export const dynamic = "force-dynamic";

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

    query = query.eq(
      "vendor_id",
      vendor?.id || "00000000-0000-0000-0000-000000000000",
    );
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data: notifications } = await query;

  return (
    <main className="page-shell">
      <MarkNotificationsReadRefresh />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <Bell size={28} className="text-white/70" />
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="mt-3 max-w-xl text-white/65">
            Booking updates, payment prompts, and platform alerts.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {(notifications ?? []).length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center text-neutral-500 shadow-sm ring-1 ring-black/5">
              No notifications yet.
            </div>
          ) : (
            (notifications ?? []).map((item) => (
              <Link
                key={item.id}
                href={item.href || "/notifications"}
                className="block rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:bg-neutral-50"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
                    <Bell size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold">{item.title}</h2>

                      {!item.read_at ? (
                        <span className="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                          New
                        </span>
                      ) : null}
                    </div>

                    {item.body ? (
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {item.body}
                      </p>
                    ) : null}

                    <p className="mt-3 text-xs text-neutral-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}