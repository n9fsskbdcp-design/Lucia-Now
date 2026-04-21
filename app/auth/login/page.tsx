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
      redirect("/vendor");
    }

    if (profile?.role === "admin") {
      redirect("/admin");
    }

    redirect("/account");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-4xl font-semibold">Login</h1>
      <p className="mt-3 text-neutral-600">
        Sign in to manage your account or continue your booking.
      </p>

      <Suspense fallback={<div className="mt-8">Loading…</div>}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-sm text-neutral-600">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-medium underline">
          Create one
        </Link>
      </p>

      <p className="mt-2 text-sm text-neutral-600">
        Want to list tours or transport?{" "}
        <Link href="/partners" className="font-medium underline">
          Become a partner
        </Link>
      </p>
    </main>
  );
}