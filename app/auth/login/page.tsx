import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "vendor") redirect("/vendor/experiences");
    if (profile?.role === "admin") redirect("/admin");

    redirect("/account");
  }

  return (
    <main className="page-shell">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_460px]">
        <div className="rounded-[2rem] bg-neutral-950 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
            Lucia Now
          </p>

          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Welcome back to better island bookings.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
            One login for travelers, partners, and admins. Your account role decides where you land.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Info label="Travelers" value="Requests & messages" />
            <Info label="Partners" value="Leads & schedules" />
            <Info label="Admins" value="Platform controls" />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-sm text-neutral-500">Login</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Access your account
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Continue to your booking requests, vendor workspace, or admin dashboard.
          </p>

          <Suspense fallback={<div className="mt-8">Loading…</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-600">
            New here?{" "}
            <Link href="/auth/signup" className="font-semibold text-neutral-950">
              Create traveler account
            </Link>{" "}
            or{" "}
            <Link href="/partners" className="font-semibold text-neutral-950">
              apply as a partner
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
        {label}
      </p>
      <p className="mt-2 text-sm text-white/85">{value}</p>
    </div>
  );
}