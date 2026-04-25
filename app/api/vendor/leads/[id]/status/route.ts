import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowed = [
  "new",
  "contacted",
  "confirmed_pending_payment",
  "paid_confirmed",
  "declined",
] as const;

function notificationTitle(state: string) {
  if (state === "confirmed_pending_payment") return "Booking accepted";
  if (state === "declined") return "Booking declined";
  if (state === "contacted") return "Vendor marked your request contacted";
  if (state === "paid_confirmed") return "Booking confirmed";
  return "Booking updated";
}

function notificationBody(state: string) {
  if (state === "confirmed_pending_payment") {
    return "Your booking request was accepted. Payment is needed to secure it.";
  }

  if (state === "declined") {
    return "The partner declined your booking request.";
  }

  if (state === "contacted") {
    return "The partner reviewed or contacted you about your request.";
  }

  if (state === "paid_confirmed") {
    return "Your booking is paid and confirmed.";
  }

  return `Your booking status changed to ${state}.`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { id } = await context.params;

  const { data: lead } = await supabaseAdmin
    .from("booking_requests")
    .select(
      `
      id,
      vendor_id,
      user_id,
      guest_email,
      guest_name,
      experiences (
        title
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!lead) {
    return NextResponse.redirect(new URL("/vendor", request.url));
  }

  if (profile?.role !== "admin") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!vendor || vendor.id !== lead.vendor_id) {
      return NextResponse.redirect(new URL("/vendor", request.url));
    }
  }

  const formData = await request.formData();
  const nextState = String(formData.get("contact_status") || "");

  if (!allowed.includes(nextState as (typeof allowed)[number])) {
    return NextResponse.redirect(new URL(`/vendor/leads/${id}`, request.url));
  }

  const payload: Record<string, unknown> = {
    contact_status: nextState,
  };

  if (nextState === "new") {
    payload.status = "new";
    payload.payment_status = "unpaid";
  }

  if (nextState === "contacted") {
    payload.status = "contacted";
    payload.payment_status = "unpaid";
  }

  if (nextState === "confirmed_pending_payment") {
    payload.status = "pending_payment";
    payload.payment_status = "unpaid";
    payload.confirmed_at = new Date().toISOString();
  }

  if (nextState === "paid_confirmed") {
    payload.status = "confirmed";
    payload.payment_status = "paid";
    payload.confirmed_at = new Date().toISOString();
    payload.paid_at = new Date().toISOString();
  }

  if (nextState === "declined") {
    payload.status = "declined";
    payload.payment_status = "unpaid";
  }

  const { error } = await supabaseAdmin
    .from("booking_requests")
    .update(payload)
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/vendor/leads/${id}?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  await supabaseAdmin.from("notifications_queue").insert({
    type: "booking_status_update",
    recipient_email: lead.guest_email,
    subject: `Booking update: ${nextState}`,
    payload: {
      booking_request_id: id,
      contact_status: nextState,
      status: payload.status,
      payment_status: payload.payment_status,
    },
  });

  if (lead.user_id) {
    await supabaseAdmin.from("app_notifications").insert({
      user_id: lead.user_id,
      type: "booking_status_update",
      title: notificationTitle(nextState),
      body: notificationBody(nextState),
      href: `/account/bookings/${id}`,
    });
  }

  return NextResponse.redirect(
    new URL(`/vendor/leads/${id}?updated=${nextState}`, request.url),
  );
}