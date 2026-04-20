import { Suspense } from "react";
import SignupForm from "./signup-form";

export default function SignupPage() {
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