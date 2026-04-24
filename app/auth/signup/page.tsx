import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const intendedRole = params.role === "vendor" ? "vendor" : "tourist";

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
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_520px]">
        <div className="rounded-[2rem] bg-neutral-950 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
            Create account
          </p>

          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Start with the right account type.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
            Travelers book experiences. Partners apply to list experiences and manage leads.
          </p>

          <div className="mt-8 rounded-3xl bg-white/10 p-5 text-sm leading-6 text-white/75 ring-1 ring-white/10">
            Partner applications are handled through the partner application flow, not a normal traveler signup.
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-sm text-neutral-500">Signup</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Create your account
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Choose traveler to book experiences, or partner to apply to list your services.
          </p>

          <Suspense fallback={<div className="mt-8">Loading…</div>}>
            <SignupForm initialRole={intendedRole} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}