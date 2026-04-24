import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AvailabilityManager from "@/components/vendor/availability-manager";
import BlackoutManager from "@/components/vendor/blackout-manager";

export default async function VendorAvailabilityPage(
  props: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await props.params;

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

  if (!profile) redirect("/");

  const { data: experience } = await supabaseAdmin
    .from("experiences")
    .select("id, title, vendor_id")
    .eq("id", id)
    .single();

  if (!experience) redirect("/vendor/experiences");

  if (profile.role !== "admin") {
    const { data: vendor } = await supabaseAdmin
      .from("vendors")
      .select("owner_user_id")
      .eq("id", experience.vendor_id)
      .single();

    if (!vendor || vendor.owner_user_id !== user.id) {
      redirect("/vendor/experiences");
    }
  }

  const { data: slots } = await supabaseAdmin
    .from("availability_slots")
    .select("*")
    .eq("experience_id", id)
    .order("starts_at", { ascending: true });

  const { data: blackouts } = await supabaseAdmin
    .from("availability_blackouts")
    .select("*")
    .eq("experience_id", id)
    .order("starts_at", { ascending: true });

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/vendor/experiences/${id}`}
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to listing
        </Link>

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Availability</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                {experience.title}
              </h1>
              <p className="mt-2 max-w-xl text-white/65">
                Add bookable times, repeat schedules, and blackout dates.
              </p>
            </div>

            <Link
              href={`/vendor/experiences/${id}/calendar`}
              className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 font-medium text-neutral-950"
            >
              <CalendarDays className="mr-2" size={18} />
              Calendar view
            </Link>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <AvailabilityManager
            experienceId={id}
            slots={(slots ?? []) as {
              id: string;
              starts_at: string;
              ends_at: string;
              capacity_total: number;
              spots_remaining: number;
              status: string;
            }[]}
          />

          <BlackoutManager
            experienceId={id}
            blackouts={(blackouts ?? []) as {
              id: string;
              starts_at: string;
              ends_at: string;
              reason: string | null;
            }[]}
          />
        </div>
      </section>
    </main>
  );
}