import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BookingRequestForm from "@/components/booking/request-form";

type SlotRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  spots_remaining: number;
};

type BlackoutRow = {
  id: string;
  starts_at: string;
  ends_at: string;
};

function isBlocked(slot: SlotRow, blackouts: BlackoutRow[]) {
  const slotStart = new Date(slot.starts_at).getTime();
  const slotEnd = new Date(slot.ends_at).getTime();

  return blackouts.some((blackout) => {
    const blackoutStart = new Date(blackout.starts_at).getTime();
    const blackoutEnd = new Date(blackout.ends_at).getTime();
    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

export default async function BookPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ slot?: string }>;
  },
) {
  const { slug } = await props.params;
  const { slot } = await props.searchParams;

  const { data: item } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!item) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name?: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  const { data: blackoutData } = await supabaseAdmin
    .from("availability_blackouts")
    .select("id, starts_at, ends_at")
    .eq("experience_id", item.id);

  const blackouts = (blackoutData ?? []) as BlackoutRow[];

  let selectedSlot: SlotRow | null = null;

  if (slot) {
    const { data } = await supabaseAdmin
      .from("availability_slots")
      .select("id, starts_at, ends_at, spots_remaining")
      .eq("id", slot)
      .eq("experience_id", item.id)
      .single();

    const maybeSlot = (data ?? null) as SlotRow | null;
    selectedSlot = maybeSlot && !isBlocked(maybeSlot, blackouts) ? maybeSlot : null;
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm text-neutral-500">Booking Request</p>

        <h1 className="mt-3 text-5xl font-semibold">{item.title}</h1>

        <p className="mt-5 text-lg text-neutral-600">
          Submit your request and the vendor can follow up with availability and next steps.
        </p>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm text-neutral-500">Starting from</p>

          <p className="mt-2 text-4xl font-semibold">${item.base_price}</p>

          {selectedSlot ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Selected slot</p>
              <p className="mt-2 font-medium">
                {new Date(selectedSlot.starts_at).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Spots left: {selectedSlot.spots_remaining}
              </p>
            </div>
          ) : slot ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-700">
              That time is no longer available.
            </div>
          ) : null}

          <BookingRequestForm
            experienceId={item.id}
            slug={item.slug}
            slotId={selectedSlot?.id || null}
            defaultName={profile?.full_name || ""}
            defaultEmail={user?.email || ""}
          />
        </div>

        <Link
          href={`/experiences/${item.slug}`}
          className="mt-8 inline-block text-sm"
        >
          ← Back to experience
        </Link>
      </section>
    </main>
  );
}