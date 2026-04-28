import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function canArchive(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "declined") return true;
  if (contactStatus === "cancelled") return true;
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") return true;

  return false;
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

  if (!canArchive(booking.contact_status, booking.payment_status)) {
    const redirectTo =
      role === "vendor" || role === "admin"
        ? `/vendor/leads/${id}`
        : `/account/bookings/${id}`;

    return NextResponse.redirect(
      new URL(
        `${redirectTo}?error=${encodeURIComponent(
          "Only closed or completed bookings can be archived",
        )}`,
        request.url,
      ),
    );
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
      .update({ archived_by_vendor: true })
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
      new URL("/vendor?archived=1#archived-leads", request.url),
    );
  }

  if (booking.user_id !== user.id) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const { error } = await supabaseAdmin
    .from("booking_requests")
    .update({ archived_by_tourist: true })
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
    new URL("/account?archived=1#archived", request.url),
  );
}