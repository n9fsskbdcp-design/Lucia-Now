import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function canManageExperience(
  experienceId: string,
  userId: string,
  role: string,
) {
  if (role === "admin") return true;

  const { data: experience } = await supabaseAdmin
    .from("experiences")
    .select("vendor_id")
    .eq("id", experienceId)
    .single();

  if (!experience) return false;

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("owner_user_id")
    .eq("id", experience.vendor_id)
    .single();

  return vendor?.owner_user_id === userId;
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string; imageId: string }>;
  },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "tourist";

  const { id, imageId } = await context.params;

  const allowed = await canManageExperience(id, user.id, role);

  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }

  const { error } = await supabaseAdmin
    .from("experience_images")
    .delete()
    .eq("id", imageId)
    .eq("experience_id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}