import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, role: profile?.role || "tourist" };
}

async function canManageExperience(
  userId: string,
  role: string,
  experienceId: string,
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const allowed = await canManageExperience(actor.user.id, actor.role, id);

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { starts_at, ends_at, reason } = body;

  if (!starts_at || !ends_at) {
    return NextResponse.json(
      { error: "Missing blackout dates" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("availability_blackouts")
    .insert({
      experience_id: id,
      starts_at,
      ends_at,
      reason: reason || null,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const allowed = await canManageExperience(actor.user.id, actor.role, id);

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const blackoutId = searchParams.get("blackout_id");

  if (!blackoutId) {
    return NextResponse.json(
      { error: "Missing blackout_id" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("availability_blackouts")
    .delete()
    .eq("id", blackoutId)
    .eq("experience_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}