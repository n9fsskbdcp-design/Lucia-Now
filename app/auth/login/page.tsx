import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-4xl font-semibold">Login</h1>

      <Suspense fallback={<div className="mt-8">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}