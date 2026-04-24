import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import ExperienceForm from "@/components/vendor/experience-form";

export default async function NewExperiencePage() {
  await requireRole(["vendor", "admin"]);

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/vendor/experiences"
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to experiences
        </Link>

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <Plus size={28} className="text-white/70" />

          <p className="mt-5 text-sm text-white/55">New listing</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Add an experience
          </h1>

          <p className="mt-3 max-w-xl text-white/65">
            Create the public listing first. You can add images and availability
            after saving.
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <ExperienceForm mode="create" />
        </div>
      </section>
    </main>
  );
}