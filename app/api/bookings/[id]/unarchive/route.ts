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
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "tourist";

  const { data: booking } = await supabaseAdmin
    .from("booking_requests")
    .select("id, user_id, vendor_id")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (role === "vendor" || role === "admin") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const isOwner = vendor?.id === booking.vendor_id;
    const isAdmin = role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.redirect(new URL("/vendor", request.url));
    }

    await supabaseAdmin
      .from("booking_requests")
      .update({ archived_by_vendor: false })
      .eq("id", id);

    return NextResponse.redirect(new URL("/vendor?restored=1", request.url));
  }

  if (booking.user_id !== user.id) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  await supabaseAdmin
    .from("booking_requests")
    .update({ archived_by_tourist: false })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.redirect(new URL("/account?restored=1", request.url));
}