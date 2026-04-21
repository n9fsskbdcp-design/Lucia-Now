import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "./signup-form";

export default async function SignupPage() {
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
      redirect("/vendor");
    }

    if (profile?.role === "admin") {
      redirect("/admin");
    }

    redirect("/account");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-4xl font-semibold">Create account</h1>
      <p className="mt-3 text-neutral-600">
        Create your Lucia Now account to book experiences or apply as a partner.
      </p>

      <Suspense fallback={<div className="mt-8">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}