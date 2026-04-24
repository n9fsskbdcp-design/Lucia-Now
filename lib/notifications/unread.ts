import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getUnreadAppNotificationCount({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  if (role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (!vendor) return 0;

    const { count } = await supabaseAdmin
      .from("app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .is("read_at", null);

    return count ?? 0;
  }

  const { count } = await supabaseAdmin
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}