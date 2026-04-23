import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowed = ["new", "contacted", "confirmed", "declined"] as const;

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
    .select("id, vendor_id, guest_email")
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
  const contactStatus = String(formData.get("contact_status") || "");

  if (!allowed.includes(contactStatus as (typeof allowed)[number])) {
    return NextResponse.redirect(new URL(`/vendor/leads/${id}`, request.url));
  }

  const finalStatus =
    contactStatus === "confirmed"
      ? "confirmed"
      : contactStatus === "declined"
        ? "declined"
        : "new";

  await supabaseAdmin
    .from("booking_requests")
    .update({
      contact_status: contactStatus,
      status: finalStatus,
    })
    .eq("id", id);

  await supabaseAdmin.from("notifications_queue").insert({
    type: "booking_status_update",
    recipient_email: lead.guest_email,
    subject: `Booking update: ${contactStatus}`,
    payload: {
      booking_request_id: id,
      contact_status: contactStatus,
      status: finalStatus,
    },
  });

  return NextResponse.redirect(new URL(`/vendor/leads/${id}`, request.url));
}