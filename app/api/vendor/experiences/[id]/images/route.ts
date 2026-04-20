import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { image_url } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image_url" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("experience_images")
      .insert({
        experience_id: id,
        image_url,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}