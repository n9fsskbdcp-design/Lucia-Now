"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const supabase = createClient();
  const params = useSearchParams();
  const intendedRole = params.get("role");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          intended_role: intendedRole || "tourist",
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your email to confirm your account.");
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-2 text-2xl font-semibold">
        {intendedRole === "vendor" ? "Become a Partner" : "Create account"}
      </h1>

      <p className="mb-6 text-sm text-neutral-600">
        {intendedRole === "vendor"
          ? "Create your account to start listing experiences on Lucia Now."
          : "Create your Lucia Now account to save details and book experiences."}
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
        <input
          className="w-full rounded border p-3"
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium underline">
          Login
        </Link>
      </p>
    </main>
  );
}