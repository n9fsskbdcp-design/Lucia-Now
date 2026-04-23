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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const spotsRemaining = Number(formData.get("spots_remaining"));

  const { data: slot } = await supabaseAdmin
    .from("availability_slots")
    .select("id, capacity_total")
    .eq("id", id)
    .single();

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (
    Number.isNaN(spotsRemaining) ||
    spotsRemaining < 0 ||
    spotsRemaining > slot.capacity_total
  ) {
    return NextResponse.json({ error: "Invalid spots value" }, { status: 400 });
  }

  await supabaseAdmin
    .from("availability_slots")
    .update({
      spots_remaining: spotsRemaining,
      status: spotsRemaining === 0 ? "sold_out" : "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.redirect(new URL(request.headers.get("referer") || "/", request.url));
}