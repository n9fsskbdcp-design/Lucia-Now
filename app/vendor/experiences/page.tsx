import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function VendorExperiencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    redirect("/");
  }

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!vendor && profile?.role !== "admin") {
    redirect("/partners/status");
  }

  const { data: experiences } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("vendor_id", vendor?.id || "")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Vendor Dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold">Your Experiences</h1>
          </div>

          <Link
            href="/vendor/experiences/new"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Add Experience
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(experiences ?? []).map((experience) => (
            <div
              key={experience.id}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{experience.title}</h2>

              <p className="mt-3 text-sm text-neutral-500">
                {experience.short_description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/vendor/experiences/${experience.id}`}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  Edit
                </Link>

                <Link
                  href={`/vendor/experiences/${experience.id}/availability`}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  Availability
                </Link>

                <Link
                  href={`/vendor/experiences/${experience.id}/calendar`}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  Calendar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}