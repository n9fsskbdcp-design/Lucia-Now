import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
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

  const { data: application } = await supabaseAdmin
    .from("vendor_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.redirect(new URL("/admin/applications", request.url));
  }

  const slug = `${slugify(application.business_name)}-${id.slice(0, 6)}`;

  let ownerUserId = application.user_id;

  if (!ownerUserId) {
    return NextResponse.redirect(new URL("/admin/applications", request.url));
  }

  const { data: existingVendor } = await supabaseAdmin
    .from("vendors")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (!existingVendor) {
    await supabaseAdmin.from("vendors").insert({
      owner_user_id: ownerUserId,
      business_name: application.business_name,
      slug,
      description: application.notes || `${application.business_name} partner on Lucia Now`,
      verification_status: "approved",
      is_verified: true,
      is_live: true,
    });
  }

  await supabaseAdmin
    .from("profiles")
    .update({ role: "vendor" })
    .eq("id", ownerUserId);

  await supabaseAdmin
    .from("vendor_applications")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.redirect(new URL("/admin/applications", request.url));
}