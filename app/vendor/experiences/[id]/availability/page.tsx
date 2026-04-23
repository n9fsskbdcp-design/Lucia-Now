import { redirect } from "next/navigation";
import Link from "next/link";
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
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Availability</p>
            <h1 className="mt-2 text-4xl font-semibold">{experience.title}</h1>
          </div>

          <div className="flex gap-3">
  <Link
    href={`/vendor/experiences/${id}/calendar`}
    className="rounded-xl border px-5 py-3"
  >
    Calendar view
  </Link>
  <Link
    href={`/vendor/experiences/${id}`}
    className="rounded-xl border px-5 py-3"
  >
    Back to listing
  </Link>
</div>
        </div>

        <div className="space-y-8">
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