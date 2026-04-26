import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", "http://localhost"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "tourist";

  let query = supabaseAdmin.from("app_notifications").delete();

  if (role === "vendor") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (vendor?.id) {
      query = query.or(`user_id.eq.${user.id},vendor_id.eq.${vendor.id}`);
    } else {
      query = query.eq("user_id", user.id);
    }
  } else {
    query = query.eq("user_id", user.id);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.redirect(
      new URL(`/notifications?error=${encodeURIComponent(error.message)}`, "http://localhost"),
    );
  }

  return NextResponse.redirect(new URL("/notifications?cleared=1", "http://localhost"));
}