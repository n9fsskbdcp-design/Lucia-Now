import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BlackoutRow = {
  id: string;
  starts_at: string;
  ends_at: string;
};

function isBlocked(startsAt: string, endsAt: string, blackouts: BlackoutRow[]) {
  const slotStart = new Date(startsAt).getTime();
  const slotEnd = new Date(endsAt).getTime();

  return blackouts.some((blackout) => {
    const blackoutStart = new Date(blackout.starts_at).getTime();
    const blackoutEnd = new Date(blackout.ends_at).getTime();

    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { experience_id, slot_id, name, email, guests, notes } = body;

    const guestCount = Number(guests);

    if (!experience_id || !name || !email || !guestCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (guestCount < 1) {
      return NextResponse.json(
        { error: "Guests must be at least 1" },
        { status: 400 },
      );
    }

    const { data: experience } = await supabaseAdmin
      .from("experiences")
      .select("id, vendor_id, title")
      .eq("id", experience_id)
      .single();

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 },
      );
    }

    let requestedStartAt: string | null = null;
    let requestedEndAt: string | null = null;

    if (slot_id) {
      const { data: slot } = await supabaseAdmin
        .from("availability_slots")
        .select("id, spots_remaining, status, experience_id, starts_at, ends_at")
        .eq("id", slot_id)
        .eq("experience_id", experience_id)
        .single();

      if (!slot) {
        return NextResponse.json(
          { error: "Selected slot not found" },
          { status: 400 },
        );
      }

      const { data: blackoutData } = await supabaseAdmin
        .from("availability_blackouts")
        .select("id, starts_at, ends_at")
        .eq("experience_id", experience_id);

      const blackouts = (blackoutData ?? []) as BlackoutRow[];

      if (isBlocked(slot.starts_at, slot.ends_at, blackouts)) {
        return NextResponse.json(
          { error: "Selected slot is blocked and cannot be booked" },
          { status: 400 },
        );
      }

      if (slot.status !== "open") {
        return NextResponse.json(
          { error: "Selected slot is not open" },
          { status: 400 },
        );
      }

      requestedStartAt = slot.starts_at;
      requestedEndAt = slot.ends_at;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("booking_requests")
      .insert({
        experience_id,
        slot_id: slot_id || null,
        vendor_id: experience.vendor_id,
        user_id: user?.id || null,
        guest_name: name,
        guest_email: email,
        guests: guestCount,
        notes: notes || null,
        requested_start_at: requestedStartAt,
        requested_end_at: requestedEndAt,
        status: "new",
        contact_status: "new",
        payment_status: "unpaid",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message || "Could not create booking request" },
        { status: 400 },
      );
    }

    await supabaseAdmin.from("notifications_queue").insert({
      type: "booking_request_vendor",
      recipient_email: email,
      subject: `Booking request received for ${experience.title}`,
      payload: {
        booking_request_id: inserted.id,
        experience_id,
        experience_title: experience.title,
      },
    });

    const { error: vendorNotificationError } = await supabaseAdmin
      .from("app_notifications")
      .insert({
        vendor_id: experience.vendor_id,
        type: "booking_request",
        title: "New booking request",
        body: `${name} requested ${experience.title}.`,
        href: `/vendor/leads/${inserted.id}`,
      });

    if (vendorNotificationError) {
      console.error("Vendor app notification failed:", vendorNotificationError);
    }

    if (user?.id) {
      const { error: touristNotificationError } = await supabaseAdmin
        .from("app_notifications")
        .insert({
          user_id: user.id,
          type: "booking_request_sent",
          title: "Booking request sent",
          body: `Your request for ${experience.title} was sent to the partner.`,
          href: `/account/bookings/${inserted.id}`,
        });

      if (touristNotificationError) {
        console.error(
          "Tourist app notification failed:",
          touristNotificationError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      booking_request_id: inserted.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}