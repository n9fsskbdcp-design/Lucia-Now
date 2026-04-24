"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Eye, EyeOff, UserRound } from "lucide-react";
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

    if (role === "vendor") {
      router.push("/partners");
      return;
    }

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
          intended_role: "tourist",
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
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("tourist")}
          className={`rounded-3xl p-4 text-left ring-1 transition ${
            role === "tourist"
              ? "bg-neutral-950 text-white ring-neutral-950"
              : "bg-neutral-50 text-neutral-950 ring-black/5"
          }`}
        >
          <UserRound size={20} />
          <p className="mt-3 text-sm font-semibold">Traveler</p>
          <p
            className={`mt-2 text-xs leading-5 ${
              role === "tourist" ? "text-white/65" : "text-neutral-500"
            }`}
          >
            Book and track experiences.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setRole("vendor")}
          className={`rounded-3xl p-4 text-left ring-1 transition ${
            role === "vendor"
              ? "bg-neutral-950 text-white ring-neutral-950"
              : "bg-neutral-50 text-neutral-950 ring-black/5"
          }`}
        >
          <BriefcaseBusiness size={20} />
          <p className="mt-3 text-sm font-semibold">Partner</p>
          <p
            className={`mt-2 text-xs leading-5 ${
              role === "vendor" ? "text-white/65" : "text-neutral-500"
            }`}
          >
            Apply to list services.
          </p>
        </button>
      </div>

      {role === "vendor" ? (
        <div className="mt-6 rounded-3xl bg-neutral-50 p-5">
          <p className="text-sm leading-6 text-neutral-600">
            Partner accounts start with an application. After approval, you’ll get access to the vendor workspace.
          </p>

          <Link
            href="/partners"
            className="mt-4 inline-flex rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
          >
            Continue to partner application
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Full name</label>
            <input
              className="w-full rounded-2xl border px-4 py-4"
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
              className="w-full rounded-2xl border px-4 py-4"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            type={passwordType}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            placeholder="Create a password"
          />

          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type={passwordType}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            placeholder="Repeat your password"
            error={showMismatch}
          />

          {showMismatch ? (
            <p className="text-sm text-red-600">Passwords do not match.</p>
          ) : passwordsStarted && passwordsMatch ? (
            <p className="text-sm text-green-700">Passwords match.</p>
          ) : null}

          {error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || showMismatch}
            className="w-full rounded-full bg-neutral-950 px-4 py-4 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create traveler account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-neutral-950">
          Login
        </Link>
      </p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  type,
  showPassword,
  setShowPassword,
  placeholder,
  error = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  placeholder: string;
  error?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          className={`w-full rounded-2xl border px-4 py-4 pr-14 ${
            error ? "border-red-400" : ""
          }`}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}