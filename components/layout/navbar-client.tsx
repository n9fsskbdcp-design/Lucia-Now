"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function NavbarClient({
  initialUser,
  role: initialRole,
}: {
  initialUser: boolean;
  role: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [hasUser, setHasUser] = useState(initialUser);
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    let mounted = true;

    async function syncSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setHasUser(!!user);

      if (!user) {
        setRole("guest");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role || "tourist");
    }

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await syncSession();
      router.refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const dashboardHref =
    role === "vendor"
      ? "/vendor"
      : role === "admin"
        ? "/admin"
        : "/account";

  const primaryLabel = role === "vendor" ? "Browse Experiences" : "Book Now";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Lucia Now
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/experiences">Experiences</Link>

            {!hasUser && (
              <>
                <Link href="/partners">Become a Partner</Link>
                <Link href="/auth/login">Login</Link>
                <Link
                  href="/experiences"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  {primaryLabel}
                </Link>
              </>
            )}

            {hasUser && (
              <>
                <Link href={dashboardHref}>Dashboard</Link>
                <Link href="/account">Account</Link>
                {role === "admin" ? (
                  <Link href="/admin/applications">Applications</Link>
                ) : null}
                <Link href="/auth/logout">Logout</Link>
                <Link
                  href="/experiences"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  {primaryLabel}
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

          {!hasUser && (
            <>
              <Link
                href="/partners"
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
              <Link
                href="/experiences"
                className="rounded-full bg-black px-4 py-2 text-white"
              >
                {primaryLabel}
              </Link>
            </>
          )}

          {hasUser && (
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
              {role === "admin" ? (
                <Link
                  href="/admin/applications"
                  className="rounded-full bg-neutral-100 px-4 py-2"
                >
                  Applications
                </Link>
              ) : null}
              <Link
                href="/auth/logout"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Logout
              </Link>
              <Link
                href="/experiences"
                className="rounded-full bg-black px-4 py-2 text-white"
              >
                {primaryLabel}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}