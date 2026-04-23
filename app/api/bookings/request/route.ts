import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: experience } = await supabaseAdmin
      .from("experiences")
      .select("id, vendor_id, title")
      .eq("id", experience_id)
      .single();

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
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
        return NextResponse.json({ error: "Selected slot not found" }, { status: 400 });
      }

      if (slot.status !== "open") {
        return NextResponse.json({ error: "Selected slot is not open" }, { status: 400 });
      }

      if (slot.spots_remaining < guestCount) {
        return NextResponse.json({ error: "Not enough spots remaining" }, { status: 400 });
      }

      requestedStartAt = slot.starts_at;
      requestedEndAt = slot.ends_at;

      const updatedSpots = slot.spots_remaining - guestCount;
      const updatedStatus = updatedSpots === 0 ? "sold_out" : "open";

      await supabaseAdmin
        .from("availability_slots")
        .update({
          spots_remaining: updatedSpots,
          status: updatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slot_id);
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
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabaseAdmin.from("notifications_queue").insert([
      {
        type: "booking_request_vendor",
        recipient_email: email,
        subject: `Booking request received for ${experience.title}`,
        payload: {
          booking_request_id: inserted?.id,
          experience_id,
          experience_title: experience.title,
        },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}