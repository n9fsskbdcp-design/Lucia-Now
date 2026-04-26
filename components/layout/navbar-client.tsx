"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Compass,
  LayoutDashboard,
  LogIn,
  Menu,
  MessageCircle,
  Search,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import LogoutButton from "./logout-button";

type Role = "guest" | "tourist" | "vendor" | "admin";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-semibold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function FloatingBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NavLink({
  href,
  label,
  active,
  count = 0,
}: {
  href: string;
  label: string;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-3.5 py-2 text-sm transition ${
        active
          ? "bg-neutral-950 text-white"
          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
      }`}
    >
      <span>{label}</span>
      <Badge count={count} />
    </Link>
  );
}

function MobileLink({
  href,
  label,
  icon,
  active,
  count = 0,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${
        active ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-800"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </span>
      <Badge count={count} />
    </Link>
  );
}

export default function NavbarClient({
  initialUser,
  initialRole,
  initialUnreadMessages,
  initialUnreadNotifications,
}: {
  initialUser: boolean;
  initialRole: string;
  initialUnreadMessages: number;
  initialUnreadNotifications: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUser, setHasUser] = useState(initialUser);
  const [role, setRole] = useState<Role>((initialRole as Role) || "guest");
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages);
  const [unreadNotifications, setUnreadNotifications] = useState(
    initialUnreadNotifications,
  );
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const hasMountedRef = useRef(false);
  const previousNotificationsRef = useRef(initialUnreadNotifications);

  const totalMobileBadges = unreadMessages + unreadNotifications;

  const syncBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/me/badges", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();

      const nextUnreadNotifications = Number(data.unreadNotifications || 0);

      setHasUser(Boolean(data.authenticated));
      setRole((data.role as Role) || "guest");
      setUnreadMessages(Number(data.unreadMessages || 0));
      setUnreadNotifications(nextUnreadNotifications);

      if (
        hasMountedRef.current &&
        nextUnreadNotifications > previousNotificationsRef.current &&
        pathname !== "/notifications"
      ) {
        setShowNotificationToast(true);

        window.setTimeout(() => {
          setShowNotificationToast(false);
        }, 4500);
      }

      previousNotificationsRef.current = nextUnreadNotifications;
    } catch {
      // Keep current navbar state if badge sync fails.
    }
  }, [pathname]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  useEffect(() => {
    setHasUser(initialUser);
    setRole((initialRole as Role) || "guest");
    setUnreadMessages(initialUnreadMessages);
    setUnreadNotifications(initialUnreadNotifications);
    previousNotificationsRef.current = initialUnreadNotifications;
  }, [
    initialUser,
    initialRole,
    initialUnreadMessages,
    initialUnreadNotifications,
  ]);

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setHasUser(false);
        setRole("guest");
        setUnreadMessages(0);
        setUnreadNotifications(0);
        previousNotificationsRef.current = 0;
        return;
      }

      await syncBadges();
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
  }, [router, supabase, syncBadges]);

  useEffect(() => {
    setMenuOpen(false);
    syncBadges();
  }, [pathname, syncBadges]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      syncBadges();
    }, 6000);

    return () => window.clearInterval(interval);
  }, [syncBadges]);

  useEffect(() => {
    function handleSync() {
      syncBadges();
    }

    window.addEventListener("focus", handleSync);
    window.addEventListener("lucia-now:sync-badges", handleSync);

    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("lucia-now:sync-badges", handleSync);
    };
  }, [syncBadges]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const dashboardHref = useMemo(() => {
    if (role === "vendor") return "/vendor/experiences";
    if (role === "admin") return "/admin";
    return "/account";
  }, [role]);

  return (
    <>
      {showNotificationToast ? (
        <Link
          href="/notifications"
          className="fixed right-4 top-20 z-[80] flex max-w-xs items-start gap-3 rounded-2xl bg-neutral-950 p-4 text-white shadow-2xl ring-1 ring-white/10"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Bell size={18} />
          </span>
          <span>
            <span className="block text-sm font-semibold">New notification</span>
            <span className="mt-1 block text-xs leading-5 text-white/65">
              You have a new Lucia Now alert.
            </span>
          </span>
        </Link>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-semibold text-white">
                L
              </span>
              <span className="text-lg font-semibold tracking-tight text-neutral-950">
                Lucia Now
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-full bg-neutral-50 p-1 lg:flex">
              <NavLink
                href="/experiences"
                label="Experiences"
                active={isActive("/experiences")}
              />

              {hasUser && role === "vendor" ? (
                <>
                  <NavLink
                    href="/vendor/experiences"
                    label="Dashboard"
                    active={isActive("/vendor/experiences")}
                  />
                  <NavLink
                    href="/vendor"
                    label="Leads"
                    active={pathname === "/vendor" || isActive("/vendor/leads")}
                  />
                </>
              ) : null}

              {hasUser && role === "admin" ? (
                <>
                  <NavLink
                    href={dashboardHref}
                    label="Admin"
                    active={isActive("/admin")}
                  />
                  <NavLink
                    href="/admin/leads"
                    label="Leads"
                    active={isActive("/admin/leads")}
                  />
                </>
              ) : null}

              {hasUser ? (
                <>
                  <NavLink
                    href="/messages"
                    label="Messages"
                    active={isActive("/messages")}
                    count={unreadMessages}
                  />
                  <NavLink
                    href="/notifications"
                    label="Alerts"
                    active={isActive("/notifications")}
                    count={unreadNotifications}
                  />
                  <NavLink
                    href="/account"
                    label="Account"
                    active={isActive("/account")}
                  />
                </>
              ) : (
                <NavLink
                  href="/partners"
                  label="Partner"
                  active={isActive("/partners")}
                />
              )}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {!hasUser ? (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/experiences"
                    className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
                  >
                    Book now
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/experiences"
                    className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
                  >
                    Browse
                  </Link>
                  <LogoutButton />
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
              <FloatingBadge count={totalMobileBadges} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />

          <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-semibold text-white">
                  L
                </span>
                <span className="text-lg font-semibold">Lucia Now</span>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 rounded-3xl bg-neutral-950 p-5 text-white">
              <p className="text-sm text-white/60">
                {hasUser
                  ? role === "vendor"
                    ? "Partner workspace"
                    : role === "admin"
                      ? "Admin workspace"
                      : "Traveler account"
                  : "Explore trusted island experiences"}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {hasUser ? "Welcome back" : "Book Saint Lucia better"}
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              <MobileLink
                href="/experiences"
                label="Experiences"
                icon={<Compass size={18} />}
                active={isActive("/experiences")}
                onClick={() => setMenuOpen(false)}
              />

              {!hasUser ? (
                <>
                  <MobileLink
                    href="/partners"
                    label="Become a Partner"
                    icon={<BriefcaseBusiness size={18} />}
                    active={isActive("/partners")}
                    onClick={() => setMenuOpen(false)}
                  />
                  <MobileLink
                    href="/auth/login"
                    label="Login"
                    icon={<LogIn size={18} />}
                    active={isActive("/auth/login")}
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              ) : null}

              {hasUser && role === "vendor" ? (
                <>
                  <MobileLink
                    href="/vendor/experiences"
                    label="Dashboard"
                    icon={<LayoutDashboard size={18} />}
                    active={isActive("/vendor/experiences")}
                    onClick={() => setMenuOpen(false)}
                  />
                  <MobileLink
                    href="/vendor"
                    label="Leads"
                    icon={<CalendarDays size={18} />}
                    active={pathname === "/vendor" || isActive("/vendor/leads")}
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              ) : null}

              {hasUser && role === "admin" ? (
                <>
                  <MobileLink
                    href="/admin"
                    label="Admin"
                    icon={<LayoutDashboard size={18} />}
                    active={isActive("/admin")}
                    onClick={() => setMenuOpen(false)}
                  />
                  <MobileLink
                    href="/admin/leads"
                    label="Leads"
                    icon={<CalendarDays size={18} />}
                    active={isActive("/admin/leads")}
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              ) : null}

              {hasUser ? (
                <>
                  <MobileLink
                    href="/messages"
                    label="Messages"
                    icon={<MessageCircle size={18} />}
                    active={isActive("/messages")}
                    count={unreadMessages}
                    onClick={() => setMenuOpen(false)}
                  />
                  <MobileLink
                    href="/notifications"
                    label="Alerts"
                    icon={<Bell size={18} />}
                    active={isActive("/notifications")}
                    count={unreadNotifications}
                    onClick={() => setMenuOpen(false)}
                  />
                  <MobileLink
                    href="/account"
                    label="Account"
                    icon={<User size={18} />}
                    active={isActive("/account")}
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              ) : null}
            </nav>

            <div className="mt-6 space-y-3">
              {hasUser ? (
                <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/experiences"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 font-medium text-white"
                >
                  <Search className="mr-2" size={18} />
                  Browse experiences
                </Link>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}