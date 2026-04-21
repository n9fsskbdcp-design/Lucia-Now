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

  return {
    user,
    role: profile?.role || "tourist",
  };
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
  try {
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
    const { start_at, end_at, capacity } = body;

    if (!start_at || !end_at || !capacity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const cap = Number(capacity);

    if (Number.isNaN(cap) || cap < 1) {
      return NextResponse.json(
        { error: "Capacity must be at least 1" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("availability_slots")
      .insert({
        experience_id: id,
        start_at,
        end_at,
        capacity: cap,
        spots_remaining: cap,
        status: "open",
      });

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    );
  }
}