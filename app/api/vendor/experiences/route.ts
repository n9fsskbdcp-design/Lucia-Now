import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { experienceSchema } from "@/lib/validation/experience";
import { slugify } from "@/lib/utils/slug";
import { getVendorByOwnerUserId } from "@/lib/db/queries/vendor";

async function getVendor() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const vendor = await getVendorByOwnerUserId(user.id);
  if (!vendor) return null;

  return vendor;
}

export async function POST(req: NextRequest) {
  const vendor = await getVendor();

  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = experienceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  if (input.max_guests < input.min_guests) {
    return NextResponse.json(
      { error: "max_guests must be >= min_guests" },
      { status: 400 }
    );
  }

  const slug = `${slugify(input.title)}-${Date.now().toString().slice(-6)}`;

  const { data: regionRow, error: regionError } = await supabaseAdmin
    .from("regions")
    .select("id")
    .eq("slug", "st-lucia")
    .single();

  if (regionError || !regionRow) {
    return NextResponse.json(
      { error: "Could not resolve region" },
      { status: 500 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("experiences")
    .insert({
      ...input,
      slug,
      vendor_id: vendor.id,
      region_id: regionRow.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}