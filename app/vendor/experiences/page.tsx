import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Edit3, Eye, Plus } from "lucide-react";
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

  if (profile?.role !== "vendor" && profile?.role !== "admin") redirect("/");

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("id, business_name")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!vendor && profile?.role !== "admin") redirect("/partners/status");

  const { data: experiences } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("vendor_id", vendor?.id || "")
    .order("created_at", { ascending: false });

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Partner dashboard</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Your Experiences
              </h1>
              <p className="mt-2 max-w-xl text-white/65">
                Manage listings, images, availability, and public booking pages.
              </p>
            </div>

            <Link
              href="/vendor/experiences/new"
              className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 font-medium text-neutral-950"
            >
              <Plus className="mr-2" size={18} />
              Add experience
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(experiences ?? []).length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5 sm:col-span-2 xl:col-span-3">
              <p className="font-medium">No experiences yet</p>
              <p className="mt-2 text-sm text-neutral-500">
                Add your first listing to start receiving booking requests.
              </p>
              <Link
                href="/vendor/experiences/new"
                className="mt-5 inline-flex rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
              >
                Add experience
              </Link>
            </div>
          ) : (
            (experiences ?? []).map((experience) => (
              <article
                key={experience.id}
                className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      {experience.status || "draft"}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-xl font-semibold">
                      {experience.title}
                    </h2>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      experience.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {experience.is_active ? "Live" : "Hidden"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">
                  {experience.short_description || "No description yet."}
                </p>

                <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    From
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    ${experience.base_price || 0}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/vendor/experiences/${experience.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white"
                  >
                    <Edit3 className="mr-2" size={16} />
                    Edit
                  </Link>

                  <Link
                    href={`/vendor/experiences/${experience.id}/availability`}
                    className="inline-flex items-center justify-center rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800"
                  >
                    <CalendarDays className="mr-2" size={16} />
                    Schedule
                  </Link>

                  <Link
                    href={`/vendor/experiences/${experience.id}/calendar`}
                    className="inline-flex items-center justify-center rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800"
                  >
                    Calendar
                  </Link>

                  {experience.slug ? (
                    <Link
                      href={`/experiences/${experience.slug}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800"
                    >
                      <Eye className="mr-2" size={16} />
                      Public
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}