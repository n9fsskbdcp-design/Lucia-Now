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
    <main className="min-h-screen bg-neutral-50 px-6 py-16">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold">Create account</h1>
          <p className="mt-3 text-neutral-600">
            Choose what kind of account you want to create.
          </p>

          <Suspense fallback={<div className="mt-8">Loading…</div>}>
            <SignupForm initialRole={intendedRole} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}