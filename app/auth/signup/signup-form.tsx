"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignupForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const intendedRole = params.get("role") === "vendor" ? "vendor" : "tourist";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = useMemo(
    () => (showPassword ? "text" : "password"),
    [showPassword],
  );

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          intended_role: intendedRole,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Account created. If email confirmation is enabled, check your inbox before signing in.",
    );
  }

  return (
    <>
      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Full name</label>
          <input
            className="w-full rounded-xl border px-4 py-4"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            className="w-full rounded-xl border px-4 py-4"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Password</label>
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border px-4 py-4"
              type={passwordType}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="rounded-xl border px-4"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Confirm password</label>
          <input
            className="w-full rounded-xl border px-4 py-4"
            type={passwordType}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-4 text-white disabled:opacity-50"
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

      {intendedRole !== "vendor" ? (
        <p className="mt-2 text-sm text-neutral-600">
          Want to list tours or transport?{" "}
          <Link href="/partners" className="font-medium underline">
            Become a partner
          </Link>
        </p>
      ) : null}
    </>
  );
}