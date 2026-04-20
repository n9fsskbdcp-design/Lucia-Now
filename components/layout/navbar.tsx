import Link from "next/link";
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

  const dashboardHref =
    role === "vendor"
      ? "/vendor/experiences"
      : role === "admin"
        ? "/admin"
        : "/account";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Lucia Now
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/experiences">Experiences</Link>

            {!user && (
              <>
                <Link href="/vendor/experiences">Become a Partner</Link>
                <Link href="/auth/login">Login</Link>
                <Link
                  href="/experiences"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  Browse Experiences
                </Link>
              </>
            )}

            {user && (
              <>
                <Link href={dashboardHref}>Dashboard</Link>
                <Link href="/account">Account</Link>
                <Link href="/auth/logout">Logout</Link>
                <Link
                  href="/experiences"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  Browse Experiences
                </Link>
              </>
            )}
          </nav>
        </div>

        <nav className="mt-4 flex flex-wrap gap-3 text-sm font-medium md:hidden">
          <Link
            href="/experiences"
            className="rounded-full bg-neutral-100 px-4 py-2"
          >
            Experiences
          </Link>

          {!user && (
            <>
              <Link
                href="/vendor/experiences"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Partner
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Login
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                href={dashboardHref}
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Account
              </Link>
              <Link
                href="/auth/logout"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Logout
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}