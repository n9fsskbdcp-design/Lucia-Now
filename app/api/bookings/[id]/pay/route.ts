import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
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

  const { data: booking } = await supabaseAdmin
    .from("booking_requests")
    .select("id, user_id, slot_id, guests, payment_status, contact_status")
    .eq("id", id)
    .single();

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.contact_status !== "confirmed_pending_payment") {
    return NextResponse.json(
      { error: "Booking is not awaiting payment" },
      { status: 400 },
    );
  }

  if (booking.payment_status === "paid") {
    return NextResponse.json({ success: true });
  }

  if (booking.slot_id) {
    const { data: slot } = await supabaseAdmin
      .from("availability_slots")
      .select("id, spots_remaining")
      .eq("id", booking.slot_id)
      .single();

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.spots_remaining < booking.guests) {
      return NextResponse.json(
        { error: "Not enough spots remaining to finalize payment" },
        { status: 400 },
      );
    }

    const nextRemaining = slot.spots_remaining - booking.guests;

    await supabaseAdmin
      .from("availability_slots")
      .update({
        spots_remaining: nextRemaining,
        status: nextRemaining === 0 ? "sold_out" : "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.slot_id);
  }

  await supabaseAdmin
    .from("booking_requests")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      contact_status: "paid_confirmed",
      status: "confirmed",
    })
    .eq("id", id);

  await supabaseAdmin.from("notifications_queue").insert({
    type: "booking_paid",
    recipient_email: user.email || "",
    subject: "Payment received",
    payload: {
      booking_request_id: id,
      payment_status: "paid",
    },
  });

  return NextResponse.json({ success: true });
}