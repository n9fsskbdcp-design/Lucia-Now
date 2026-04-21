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

    const {
      experience_id,
      slot_id,
      name,
      email,
      guests,
      notes,
    } = body;

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
      .select("id, vendor_id")
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
      const { data: slot, error: slotError } = await supabaseAdmin
        .from("availability_slots")
        .select("id, spots_remaining, status, experience_id, starts_at, ends_at")
        .eq("id", slot_id)
        .eq("experience_id", experience_id)
        .single();

      if (slotError || !slot) {
        return NextResponse.json(
          { error: "Selected slot not found" },
          { status: 400 },
        );
      }

      if (slot.status !== "open") {
        return NextResponse.json(
          { error: "Selected slot is not open" },
          { status: 400 },
        );
      }

      if (slot.spots_remaining < guestCount) {
        return NextResponse.json(
          { error: "Not enough spots remaining" },
          { status: 400 },
        );
      }

      requestedStartAt = slot.starts_at;
      requestedEndAt = slot.ends_at;

      const updatedSpots = slot.spots_remaining - guestCount;
      const updatedStatus = updatedSpots === 0 ? "sold_out" : "open";

      const { error: updateError } = await supabaseAdmin
        .from("availability_slots")
        .update({
          spots_remaining: updatedSpots,
          status: updatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slot_id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 },
        );
      }
    }

    const { error } = await supabaseAdmin
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
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    );
  }
}