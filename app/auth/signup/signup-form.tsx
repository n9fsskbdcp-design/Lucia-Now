"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type Role = "tourist" | "vendor";

export default function SignupForm({
  initialRole,
}: {
  initialRole: Role;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordType = useMemo(
    () => (showPassword ? "text" : "password"),
    [showPassword],
  );

  const passwordsStarted = password.length > 0 || confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const showMismatch = passwordsStarted && !passwordsMatch;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!passwordsMatch) {
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
          intended_role: role,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (role === "vendor") {
      setMessage(
        "Account created. After login, apply as a partner to access vendor tools.",
      );
      router.push("/partners");
      router.refresh();
      return;
    }

    setMessage(
      "Account created. If email confirmation is enabled, check your inbox before signing in.",
    );
  }

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("tourist")}
          className={`rounded-2xl border p-4 text-left transition ${
            role === "tourist"
              ? "border-black bg-black text-white"
              : "border-neutral-200 bg-white text-neutral-900"
          }`}
        >
          <p className="text-sm font-medium">Traveler</p>
          <p
            className={`mt-2 text-sm ${
              role === "tourist" ? "text-white/80" : "text-neutral-500"
            }`}
          >
            Browse experiences and manage booking requests.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setRole("vendor")}
          className={`rounded-2xl border p-4 text-left transition ${
            role === "vendor"
              ? "border-black bg-black text-white"
              : "border-neutral-200 bg-white text-neutral-900"
          }`}
        >
          <p className="text-sm font-medium">Partner</p>
          <p
            className={`mt-2 text-sm ${
              role === "vendor" ? "text-white/80" : "text-neutral-500"
            }`}
          >
            List experiences, manage availability, and receive leads.
          </p>
        </button>
      </div>

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
          <div className="relative">
            <input
              className="w-full rounded-xl border px-4 py-4 pr-14"
              type={passwordType}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Confirm password
          </label>
          <div className="relative">
            <input
              className={`w-full rounded-xl border px-4 py-4 pr-14 ${
                showMismatch ? "border-red-500" : ""
              }`}
              type={passwordType}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {showMismatch ? (
            <p className="mt-2 text-sm text-red-600">
              Passwords do not match.
            </p>
          ) : passwordsStarted && passwordsMatch ? (
            <p className="mt-2 text-sm text-green-700">
              Passwords match.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
          {role === "tourist" ? (
            <p>
              You are creating a <strong>Traveler</strong> account.
            </p>
          ) : (
            <p>
              You are creating a <strong>Partner</strong> account.
            </p>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <button
          type="submit"
          disabled={loading || showMismatch}
          className="w-full rounded-xl bg-black px-4 py-4 text-white disabled:opacity-50"
        >
          {loading
            ? "Creating account..."
            : role === "vendor"
              ? "Create partner account"
              : "Create traveler account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium underline">
          Login
        </Link>
      </p>
    </div>
  );
}