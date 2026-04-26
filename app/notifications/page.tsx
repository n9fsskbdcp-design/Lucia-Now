import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MarkNotificationsReadRefresh from "@/components/notifications/mark-notifications-read-refresh";

export const dynamic = "force-dynamic";

function notificationIcon(type: string) {
  if (type === "booking_message") return <MessageCircle size={20} />;
  if (type === "booking_paid") return <CreditCard size={20} />;
  if (type === "booking_cancelled") return <XCircle size={20} />;
  if (type === "booking_status_update") return <CheckCircle2 size={20} />;
  if (type === "booking_request") return <CalendarCheck size={20} />;
  return <Bell size={20} />;
}

function notificationTone(type: string) {
  if (type === "booking_cancelled") return "bg-red-50 text-red-700";
  if (type === "booking_paid") return "bg-green-50 text-green-700";
  if (type === "booking_status_update") return "bg-amber-50 text-amber-700";
  if (type === "booking_message") return "bg-blue-50 text-blue-700";
  return "bg-neutral-100 text-neutral-700";
}

function notificationLabel(type: string) {
  if (type === "booking_request") return "Booking request";
  if (type === "booking_request_sent") return "Request sent";
  if (type === "booking_status_update") return "Status update";
  if (type === "booking_message") return "Message";
  if (type === "booking_paid") return "Payment";
  if (type === "booking_cancelled") return "Cancellation";
  return "Alert";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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

    if (vendor?.id) {
      query = query.or(`user_id.eq.${user.id},vendor_id.eq.${vendor.id}`);
    } else {
      query = query.eq("user_id", user.id);
    }
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data: notifications } = await query;

  const items = notifications ?? [];
  const unread = items.filter((item) => !item.read_at);
  const read = items.filter((item) => item.read_at);

  return (
    <main className="page-shell">
      <MarkNotificationsReadRefresh />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Bell size={24} />
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight">
                Alerts
              </h1>

              <p className="mt-3 max-w-xl text-white/65">
                Booking requests, payment prompts, cancellations, and message alerts.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/10">
              <p className="text-sm text-white/60">Unread</p>
              <p className="mt-1 text-3xl font-semibold">{unread.length}</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
              <Bell size={24} />
            </div>
            <h2 className="mt-5 text-xl font-semibold">No alerts yet</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Important booking and message activity will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {unread.length > 0 ? (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">New</h2>
                    <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                      {unread.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {unread.map((item) => (
                      <NotificationCard key={item.id} item={item} unread />
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {unread.length > 0 ? "Earlier" : "Recent"}
                  </h2>
                </div>

                {read.length === 0 ? (
                  <div className="rounded-[1.75rem] bg-white p-6 text-sm text-neutral-500 shadow-sm ring-1 ring-black/5">
                    No earlier alerts.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {read.map((item) => (
                      <NotificationCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold">Alert types</h2>

              <div className="mt-4 space-y-3">
                <MiniLegend
                  icon={<CalendarCheck size={18} />}
                  title="Bookings"
                  body="New requests and booking activity."
                />
                <MiniLegend
                  icon={<CheckCircle2 size={18} />}
                  title="Status"
                  body="Accepted, declined, or updated requests."
                />
                <MiniLegend
                  icon={<CreditCard size={18} />}
                  title="Payments"
                  body="Payment prompts and confirmations."
                />
                <MiniLegend
                  icon={<MessageCircle size={18} />}
                  title="Messages"
                  body="Traveler and partner replies."
                />
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function NotificationCard({
  item,
  unread = false,
}: {
  item: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    href: string | null;
    read_at: string | null;
    created_at: string;
  };
  unread?: boolean;
}) {
  return (
    <Link
      href={item.href || "/notifications"}
      className={`block rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:bg-neutral-50 hover:shadow-md ${
        unread ? "ring-neutral-950/15" : "ring-black/5"
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${notificationTone(
            item.type,
          )}`}
        >
          {notificationIcon(item.type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {notificationLabel(item.type)}
                </span>

                {unread ? (
                  <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                    New
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                {item.title}
              </h3>
            </div>

            <p className="shrink-0 text-xs text-neutral-400">
              {formatDate(item.created_at)}
            </p>
          </div>

          {item.body ? (
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {item.body}
            </p>
          ) : null}

          <p className="mt-4 text-sm font-medium text-neutral-950">
            Open details →
          </p>
        </div>
      </div>
    </Link>
  );
}

function MiniLegend({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
          {icon}
        </div>
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{body}</p>
    </div>
  );
}