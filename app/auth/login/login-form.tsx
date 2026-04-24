"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();

  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordType = useMemo(
    () => (showPassword ? "text" : "password"),
    [showPassword],
  );

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorText("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorText(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (next) {
      router.push(next);
      router.refresh();
      return;
    }

    if (profile?.role === "vendor") {
      router.push("/vendor/experiences");
      router.refresh();
      return;
    }

    if (profile?.role === "admin") {
      router.push("/admin");
      router.refresh();
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={login} className="mt-8 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border px-4 py-4"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>
        <div className="relative">
          <input
            type={passwordType}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border px-4 py-4 pr-14"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {errorText ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {errorText}
        </div>
      ) : null}

      <button
        disabled={loading}
        className="w-full rounded-full bg-neutral-950 py-4 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}