import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function MessagesPage() {
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
  const recipientRole =
    role === "vendor" ? "vendor" : role === "admin" ? "admin" : "tourist";

  let bookingIds: string[] = [];

  if (role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const { data: bookings } = await supabaseAdmin
      .from("booking_requests")
      .select("id")
      .eq("vendor_id", vendor?.id || "");

    bookingIds = (bookings ?? []).map((booking) => booking.id);
  } else if (role === "admin") {
    const { data: bookings } = await supabaseAdmin
      .from("booking_requests")
      .select("id");

    bookingIds = (bookings ?? []).map((booking) => booking.id);
  } else {
    const { data: bookings } = await supabaseAdmin
      .from("booking_requests")
      .select("id")
      .eq("user_id", user.id);

    bookingIds = (bookings ?? []).map((booking) => booking.id);
  }

  const { data: bookings } = bookingIds.length
    ? await supabaseAdmin
        .from("booking_requests")
        .select(
          `
          id,
          guest_name,
          guest_email,
          contact_status,
          payment_status,
          requested_start_at,
          experiences (
            title,
            slug
          )
        `,
        )
        .in("id", bookingIds)
    : { data: [] };

  const { data: messages } = bookingIds.length
    ? await supabaseAdmin
        .from("booking_messages")
        .select("*")
        .in("booking_request_id", bookingIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const latestByBooking = new Map<string, any>();
  const unreadByBooking = new Map<string, number>();

  for (const message of messages ?? []) {
    if (!latestByBooking.has(message.booking_request_id)) {
      latestByBooking.set(message.booking_request_id, message);
    }

    if (message.recipient_role === recipientRole && message.read_at === null) {
      unreadByBooking.set(
        message.booking_request_id,
        (unreadByBooking.get(message.booking_request_id) || 0) + 1,
      );
    }
  }

  const sortedBookings = [...(bookings ?? [])].sort((a: any, b: any) => {
    const aLatest = latestByBooking.get(a.id)?.created_at || "";
    const bLatest = latestByBooking.get(b.id)?.created_at || "";
    return new Date(bLatest).getTime() - new Date(aLatest).getTime();
  });

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <MessageCircle size={28} className="text-white/70" />
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Messages
          </h1>
          <p className="mt-3 max-w-xl text-white/65">
            Keep every traveler and partner conversation attached to the booking.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {sortedBookings.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="font-medium">No conversations yet</p>
              <p className="mt-2 text-sm text-neutral-500">
                Messages appear after a booking request is created.
              </p>
            </div>
          ) : (
            sortedBookings.map((booking: any) => {
              const latest = latestByBooking.get(booking.id);
              const unread = unreadByBooking.get(booking.id) || 0;

              return (
                <Link
                  key={booking.id}
                  href={`/messages/${booking.id}`}
                  className="block rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:bg-neutral-50"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
                      <MessageCircle size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold">
                            {booking.experiences?.title || "Booking conversation"}
                          </h2>
                          <p className="mt-1 truncate text-sm text-neutral-500">
                            {role === "tourist"
                              ? "Vendor conversation"
                              : `${booking.guest_name} · ${booking.guest_email}`}
                          </p>
                        </div>

                        {unread > 0 ? (
                          <span className="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                            {unread}
                          </span>
                        ) : null}
                      </div>

                      {latest ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-700">
                          <span className="font-medium capitalize">
                            {latest.sender_role}:
                          </span>{" "}
                          {latest.message}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-neutral-500">
                          No messages yet.
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}