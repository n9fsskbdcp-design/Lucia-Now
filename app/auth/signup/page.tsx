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
          <h1 className="text-4xl font-semibold">
            {intendedRole === "vendor" ? "Create partner account" : "Create traveler account"}
          </h1>

          <p className="mt-3 text-neutral-600">
            {intendedRole === "vendor"
              ? "Create your account first. Partner approval and vendor access come after that."
              : "Create a normal account to browse experiences and track your booking requests."}
          </p>

          <Suspense fallback={<div className="mt-8">Loading…</div>}>
            <SignupForm />
          </Suspense>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">Simple explanation</p>
            <h2 className="mt-2 text-xl font-semibold">Who is this for?</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <p><strong>Traveler account:</strong> book experiences and manage requests.</p>
              <p><strong>Partner account:</strong> apply to list experiences and receive leads.</p>
              <p><strong>Same login page later:</strong> your role decides where you land.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}