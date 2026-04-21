import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  if (profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const field = String(formData.get("field") || "");

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("is_verified, is_live")
    .eq("id", id)
    .single();

  if (!vendor) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (field === "is_verified") {
    await supabaseAdmin
      .from("vendors")
      .update({
        is_verified: !vendor.is_verified,
        verification_status: !vendor.is_verified ? "approved" : "pending",
      })
      .eq("id", id);
  }

  if (field === "is_live") {
    await supabaseAdmin
      .from("vendors")
      .update({
        is_live: !vendor.is_live,
      })
      .eq("id", id);
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}