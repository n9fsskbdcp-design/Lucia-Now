import { redirect } from "next/navigation";
import Link from "next/link";
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

    if (
      message.recipient_role === recipientRole &&
      message.read_at === null
    ) {
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
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold">Messages</h1>
        <p className="mt-3 text-neutral-600">
          Conversations connected to booking requests.
        </p>

        <div className="mt-10 space-y-4">
          {sortedBookings.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-neutral-500 shadow-sm">
              No message conversations yet.
            </div>
          ) : (
            sortedBookings.map((booking: any) => {
              const latest = latestByBooking.get(booking.id);
              const unread = unreadByBooking.get(booking.id) || 0;

              return (
                <Link
                  key={booking.id}
                  href={`/messages/${booking.id}`}
                  className="block rounded-3xl bg-white p-6 shadow-sm transition hover:bg-neutral-100"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold">
                          {booking.experiences?.title || "Booking conversation"}
                        </h2>

                        {unread > 0 ? (
                          <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                            {unread} new
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-neutral-500">
                        {role === "tourist"
                          ? "Vendor conversation"
                          : `${booking.guest_name} · ${booking.guest_email}`}
                      </p>

                      {booking.requested_start_at ? (
                        <p className="mt-1 text-sm text-neutral-500">
                          {new Date(booking.requested_start_at).toLocaleString()}
                        </p>
                      ) : null}

                      {latest ? (
                        <p className="mt-4 line-clamp-2 text-sm text-neutral-700">
                          <span className="font-medium capitalize">
                            {latest.sender_role}:
                          </span>{" "}
                          {latest.message}
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-neutral-500">
                          No messages yet.
                        </p>
                      )}
                    </div>

                    <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                      {booking.contact_status}
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