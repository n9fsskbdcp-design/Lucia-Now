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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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
    const {
      starts_at,
      duration_minutes,
      capacity_total,
      weeks,
    } = body;

    const duration = Number(duration_minutes);
    const capacity = Number(capacity_total);
    const repeatWeeks = Number(weeks);

    if (!starts_at || !duration || !capacity || !repeatWeeks) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (duration < 1 || capacity < 1 || repeatWeeks < 1) {
      return NextResponse.json(
        { error: "Invalid values" },
        { status: 400 },
      );
    }

    const baseStart = new Date(starts_at);

    const rows = Array.from({ length: repeatWeeks }).map((_, index) => {
      const start = addDays(baseStart, index * 7);
      const end = new Date(start.getTime() + duration * 60 * 1000);

      return {
        experience_id: id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        capacity_total: capacity,
        spots_remaining: capacity,
        status: "open",
      };
    });

    const { error } = await supabaseAdmin
      .from("availability_slots")
      .insert(rows);

    if (error) {
      return NextResponse.json(
        { error: error.message },
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