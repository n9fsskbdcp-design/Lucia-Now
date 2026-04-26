import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowed = ["contacted", "confirmed_pending_payment", "declined"] as const;

const transitions: Record<string, string[]> = {
  new: ["contacted", "confirmed_pending_payment", "declined"],
  contacted: ["confirmed_pending_payment", "declined"],
  confirmed_pending_payment: ["declined"],
  paid_confirmed: [],
  declined: [],
  cancelled: [],
};

function notificationTitle(state: string) {
  if (state === "confirmed_pending_payment") return "Booking accepted";
  if (state === "declined") return "Booking declined";
  if (state === "contacted") return "Booking request updated";
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
    return "The partner reviewed your booking request.";
  }

  return "Your booking request was updated.";
}

function statusPayload(nextState: string) {
  if (nextState === "contacted") {
    return {
      status: "contacted",
      contact_status: "contacted",
      payment_status: "unpaid",
    };
  }

  if (nextState === "confirmed_pending_payment") {
    return {
      status: "pending_payment",
      contact_status: "confirmed_pending_payment",
      payment_status: "unpaid",
      confirmed_at: new Date().toISOString(),
    };
  }

  if (nextState === "declined") {
    return {
      status: "declined",
      contact_status: "declined",
      payment_status: "unpaid",
    };
  }

  return {};
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
      status,
      contact_status,
      payment_status,
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
    return NextResponse.redirect(
      new URL(`/vendor/leads/${id}?error=Invalid status`, request.url),
    );
  }

  const currentState = lead.contact_status || "new";

  if (currentState === nextState) {
    return NextResponse.redirect(
      new URL(
        `/vendor/leads/${id}?error=Status is already ${nextState}`,
        request.url,
      ),
    );
  }

  const allowedNextStates = transitions[currentState] ?? [];

  if (!allowedNextStates.includes(nextState)) {
    return NextResponse.redirect(
      new URL(
        `/vendor/leads/${id}?error=This status change is not allowed`,
        request.url,
      ),
    );
  }

  if (lead.payment_status === "paid") {
    return NextResponse.redirect(
      new URL(
        `/vendor/leads/${id}?error=Paid bookings cannot be changed here`,
        request.url,
      ),
    );
  }

  const payload = statusPayload(nextState);

  const { error } = await supabaseAdmin
    .from("booking_requests")
    .update(payload)
    .eq("id", id)
    .eq("contact_status", currentState);

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
    subject: `Booking update: ${notificationTitle(nextState)}`,
    payload: {
      booking_request_id: id,
      previous_contact_status: currentState,
      contact_status: nextState,
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