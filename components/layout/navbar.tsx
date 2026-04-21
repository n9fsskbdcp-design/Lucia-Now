import NavbarClient from "./navbar-client";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "guest";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role || "tourist";
  }

  return <NavbarClient initialUser={!!user} role={role} />;
}