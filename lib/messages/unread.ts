import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getUnreadMessageCount({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  if (role === "admin") {
    const { count } = await supabaseAdmin
      .from("booking_messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);

    return count ?? 0;
  }

  if (role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (!vendor) return 0;

    const { data: bookings } = await supabaseAdmin
      .from("booking_requests")
      .select("id")
      .eq("vendor_id", vendor.id);

    const bookingIds = (bookings ?? []).map((booking) => booking.id);

    if (bookingIds.length === 0) return 0;

    const { count } = await supabaseAdmin
      .from("booking_messages")
      .select("id", { count: "exact", head: true })
      .in("booking_request_id", bookingIds)
      .eq("recipient_role", "vendor")
      .is("read_at", null);

    return count ?? 0;
  }

  const { data: bookings } = await supabaseAdmin
    .from("booking_requests")
    .select("id")
    .eq("user_id", userId);

  const bookingIds = (bookings ?? []).map((booking) => booking.id);

  if (bookingIds.length === 0) return 0;

  const { count } = await supabaseAdmin
    .from("booking_messages")
    .select("id", { count: "exact", head: true })
    .in("booking_request_id", bookingIds)
    .eq("recipient_role", "tourist")
    .is("read_at", null);

  return count ?? 0;
}