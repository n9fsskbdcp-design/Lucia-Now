"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import LogoutButton from "./logout-button";

type Role = "guest" | "tourist" | "vendor" | "admin";

export default function NavbarClient({
  initialUser,
  initialRole,
}: {
  initialUser: boolean;
  initialRole: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [hasUser, setHasUser] = useState(initialUser);
  const [role, setRole] = useState<Role>((initialRole as Role) || "guest");

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

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

      setRole((profile?.role as Role) || "tourist");
    }

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncSession();
      router.refresh();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const dashboardHref = useMemo(() => {
    if (role === "vendor") return "/vendor/experiences";
    if (role === "admin") return "/admin";
    return "/account";
  }, [role]);

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

            {hasUser && role === "vendor" && (
              <>
                <Link href="/vendor/experiences">Dashboard</Link>
                <Link href="/vendor">Leads</Link>
                <Link href="/account">Account</Link>
                <LogoutButton />
                <Link
                  href="/experiences"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  {primaryLabel}
                </Link>
              </>
            )}

            {hasUser && role === "admin" && (
              <>
                <Link href={dashboardHref}>Dashboard</Link>
                <Link href="/admin/applications">Applications</Link>
                <Link href="/account">Account</Link>
                <LogoutButton />
                <Link
                  href="/experiences"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  {primaryLabel}
                </Link>
              </>
            )}

            {hasUser && role !== "vendor" && role !== "admin" && (
              <>
                <Link href={dashboardHref}>Dashboard</Link>
                <Link href="/account">Account</Link>
                <LogoutButton />
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

          {hasUser && role === "vendor" && (
            <>
              <Link
                href="/vendor/experiences"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/vendor"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Leads
              </Link>
              <Link
                href="/account"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Account
              </Link>
              <span className="rounded-full bg-neutral-100 px-4 py-2">
                <LogoutButton />
              </span>
              <Link
                href="/experiences"
                className="rounded-full bg-black px-4 py-2 text-white"
              >
                {primaryLabel}
              </Link>
            </>
          )}

          {hasUser && role === "admin" && (
            <>
              <Link
                href="/admin"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/applications"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Applications
              </Link>
              <Link
                href="/account"
                className="rounded-full bg-neutral-100 px-4 py-2"
              >
                Account
              </Link>
              <span className="rounded-full bg-neutral-100 px-4 py-2">
                <LogoutButton />
              </span>
              <Link
                href="/experiences"
                className="rounded-full bg-black px-4 py-2 text-white"
              >
                {primaryLabel}
              </Link>
            </>
          )}

          {hasUser && role !== "vendor" && role !== "admin" && (
            <>
              <Link
                href="/account"
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
              <span className="rounded-full bg-neutral-100 px-4 py-2">
                <LogoutButton />
              </span>
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