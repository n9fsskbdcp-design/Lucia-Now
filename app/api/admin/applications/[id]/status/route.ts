import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowed = ["new", "reviewing", "approved", "rejected"] as const;

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

  const formData = await request.formData();
  const status = String(formData.get("status") || "");

  if (!allowed.includes(status as (typeof allowed)[number])) {
    return NextResponse.redirect(new URL("/admin/applications", request.url));
  }

  const { id } = await context.params;

  await supabaseAdmin
    .from("vendor_applications")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.redirect(new URL("/admin/applications", request.url));
}