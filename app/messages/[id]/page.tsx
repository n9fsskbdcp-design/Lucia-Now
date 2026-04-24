import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";
import MarkReadRefresh from "@/components/messages/mark-read-refresh";

export const dynamic = "force-dynamic";

export default async function MessageConversationPage(
  props: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await props.params;

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

  const { data: booking } = await supabaseAdmin
    .from("booking_requests")
    .select(
      `
      *,
      experiences (
        title,
        slug
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!booking) notFound();

  let allowed = booking.user_id === user.id || role === "admin";

  if (!allowed && role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    allowed = vendor?.id === booking.vendor_id;
  }

  if (!allowed) redirect("/");

  await supabaseAdmin
    .from("booking_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("booking_request_id", id)
    .eq("recipient_role", recipientRole)
    .is("read_at", null);

  const { data: messages } = await supabaseAdmin
    .from("booking_messages")
    .select("*")
    .eq("booking_request_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="page-shell">
      <MarkReadRefresh />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">Conversation</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {booking.experiences?.title || "Booking"}
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              {role === "tourist"
                ? "Chat with the partner about this request."
                : `Chat with ${booking.guest_name}.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/messages" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5">
              All messages
            </Link>

            {role === "vendor" || role === "admin" ? (
              <Link
                href={`/vendor/leads/${booking.id}`}
                className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
              >
                Lead
              </Link>
            ) : (
              <Link
                href={`/account/bookings/${booking.id}`}
                className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
              >
                Booking
              </Link>
            )}
          </div>
        </div>

        <MessageThread
          bookingId={booking.id}
          messages={
            (messages ?? []) as {
              id: string;
              sender_role: string;
              message: string;
              created_at: string;
            }[]
          }
        />
      </section>
    </main>
  );
}