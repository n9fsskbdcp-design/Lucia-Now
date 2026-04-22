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

    if (profile?.role === "vendor") {
      redirect("/vendor/experiences");
    }

    if (profile?.role === "admin") {
      redirect("/admin");
    }

    redirect("/account");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold">Login</h1>
          <p className="mt-3 text-neutral-600">
            One login for everyone. Traveler accounts go to your account.
            Partner accounts go to your vendor dashboard.
          </p>

          <Suspense fallback={<div className="mt-8">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">Booking experiences?</p>
            <h2 className="mt-2 text-xl font-semibold">Traveler account</h2>
            <p className="mt-3 text-sm text-neutral-600">
              Create a normal account to browse, request bookings, and track them in your account.
            </p>
            <Link
              href="/auth/signup"
              className="mt-5 inline-block rounded-xl bg-black px-5 py-3 text-white"
            >
              Create traveler account
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">Own tours or transport?</p>
            <h2 className="mt-2 text-xl font-semibold">Partner account</h2>
            <p className="mt-3 text-sm text-neutral-600">
              Apply as a partner if you want to list experiences and manage leads.
            </p>
            <Link
              href="/partners"
              className="mt-5 inline-block rounded-xl border px-5 py-3"
            >
              Become a partner
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}