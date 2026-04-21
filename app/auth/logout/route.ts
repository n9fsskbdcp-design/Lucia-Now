import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handleLogout(request: Request) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/", request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}