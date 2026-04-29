import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function getVendorRestorePath(contactStatus: string | null, paymentStatus: string | null) {
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "/vendor?restored=1#confirmed-leads";
  }

  return "/vendor?restored=1#closed-leads";
}

function getTouristRestorePath(contactStatus: string | null, paymentStatus: string | null) {
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "/account?restored=1#confirmed";
  }

  return "/account?restored=1#closed";
}

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
    .select("id, user_id, vendor_id, contact_status, payment_status")
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

    const { error } = await supabaseAdmin
      .from("booking_requests")
      .update({ archived_by_vendor: false })
      .eq("id", id);

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/vendor/leads/${id}?error=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
    }

    return NextResponse.redirect(
      new URL(
        getVendorRestorePath(booking.contact_status, booking.payment_status),
        request.url,
      ),
    );
  }

  if (booking.user_id !== user.id) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const { error } = await supabaseAdmin
    .from("booking_requests")
    .update({ archived_by_tourist: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/account/bookings/${id}?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      getTouristRestorePath(booking.contact_status, booking.payment_status),
      request.url,
    ),
  );
}