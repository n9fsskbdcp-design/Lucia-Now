import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const message = String(formData.get("message") || "").trim();

  if (!message) {
    return NextResponse.redirect(
      new URL(request.headers.get("referer") || "/", request.url),
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "tourist";

  const { data: booking } = await supabaseAdmin
    .from("booking_requests")
    .select("id, user_id, vendor_id, guest_email")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let allowed = booking.user_id === user.id || role === "admin";

  if (!allowed && role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    allowed = vendor?.id === booking.vendor_id;
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const senderRole =
    role === "vendor" ? "vendor" : role === "admin" ? "admin" : "tourist";

  const recipientRole =
    senderRole === "tourist"
      ? "vendor"
      : senderRole === "vendor"
        ? "tourist"
        : "tourist";

  await supabaseAdmin.from("booking_messages").insert({
    booking_request_id: id,
    sender_id: user.id,
    sender_role: senderRole,
    recipient_role: recipientRole,
    message,
  });

  await supabaseAdmin.from("notifications_queue").insert({
    type: "booking_message",
    recipient_email: booking.guest_email,
    subject: "New booking message",
    payload: {
      booking_request_id: id,
      sender_role: senderRole,
      recipient_role: recipientRole,
    },
  });

  if (recipientRole === "vendor") {
    await supabaseAdmin.from("app_notifications").insert({
      vendor_id: booking.vendor_id,
      type: "booking_message",
      title: "New message",
      body: "A traveler sent you a message.",
      href: `/messages/${id}`,
    });
  }

  if (recipientRole === "tourist" && booking.user_id) {
    await supabaseAdmin.from("app_notifications").insert({
      user_id: booking.user_id,
      type: "booking_message",
      title: "New message",
      body: "A vendor sent you a message.",
      href: `/messages/${id}`,
    });
  }

  return NextResponse.redirect(
    new URL(request.headers.get("referer") || "/", request.url),
  );
}