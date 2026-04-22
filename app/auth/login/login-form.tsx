"use client";

import { useMemo, useState } from "react";
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
          className="w-full rounded-xl border px-4 py-4"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>
        <div className="flex gap-2">
          <input
            type={passwordType}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-4"
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

      {errorText ? (
        <p className="text-sm text-red-600">{errorText}</p>
      ) : null}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-black py-4 text-white disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}