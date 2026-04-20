"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();

  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
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
      return;
    }

    if (profile?.role === "vendor") {
      router.push("/vendor/experiences");
      return;
    }

    if (profile?.role === "admin") {
      router.push("/admin");
      return;
    }

    router.push("/account");
  }

  return (
    <form onSubmit={login} className="mt-8 space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border px-4 py-4"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border px-4 py-4"
      />

      <button className="w-full rounded-xl bg-black py-4 text-white">
        Login
      </button>
    </form>
  );
}