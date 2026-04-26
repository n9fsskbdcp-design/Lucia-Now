import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function canCancel(contactStatus: string, paymentStatus: string) {
  if (paymentStatus === "paid") return false;

  return ["new", "contacted", "confirmed_pending_payment"].includes(
    contactStatus,
  );
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
    .select(
      `
      id,
      user_id,
      vendor_id,
      guest_email,
      guest_name,
      contact_status,
      payment_status,
      experiences (
        title
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let allowed = false;
  let cancelledBy = "tourist";
  let redirectTo = `/account/bookings/${id}`;

  if (role === "admin") {
    allowed = true;
    cancelledBy = "admin";
    redirectTo = `/admin/leads`;
  } else if (role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    allowed = vendor?.id === booking.vendor_id;
    cancelledBy = "vendor";
    redirectTo = `/vendor/leads/${id}`;
  } else {
    allowed = booking.user_id === user.id;
    cancelledBy = "tourist";
    redirectTo = `/account/bookings/${id}`;
  }

  if (!allowed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!canCancel(booking.contact_status, booking.payment_status)) {
    return NextResponse.redirect(
      new URL(
        `${redirectTo}?error=This booking cannot be cancelled`,
        request.url,
      ),
    );
  }

  const { error } = await supabaseAdmin
    .from("booking_requests")
    .update({
      status: "cancelled",
      contact_status: "cancelled",
    })
    .eq("id", id)
    .neq("payment_status", "paid");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `${redirectTo}?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  await supabaseAdmin.from("notifications_queue").insert({
    type: "booking_cancelled",
    recipient_email: booking.guest_email,
    subject: "Booking request cancelled",
    payload: {
      booking_request_id: id,
      cancelled_by: cancelledBy,
    },
  });

  if (cancelledBy === "tourist") {
    await supabaseAdmin.from("app_notifications").insert({
      vendor_id: booking.vendor_id,
      type: "booking_cancelled",
      title: "Booking request cancelled",
      body: `${booking.guest_name || "A traveler"} cancelled their request.`,
      href: `/vendor/leads/${id}`,
    });
  } else if (booking.user_id) {
    await supabaseAdmin.from("app_notifications").insert({
      user_id: booking.user_id,
      type: "booking_cancelled",
      title: "Booking request cancelled",
      body:
        cancelledBy === "vendor"
          ? "The partner cancelled this booking request."
          : "An admin cancelled this booking request.",
      href: `/account/bookings/${id}`,
    });
  }

  return NextResponse.redirect(
    new URL(`${redirectTo}?cancelled=1`, request.url),
  );
}