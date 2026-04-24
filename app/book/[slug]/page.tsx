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
    <main className="page-shell">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Booking request</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {item.title}
          </h1>
          <p className="mt-4 max-w-2xl text-white/65">
            Send a request to the partner. Payment only happens after the partner accepts.
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Starting from</p>
              <p className="mt-1 text-4xl font-semibold">${item.base_price}</p>
            </div>

            <Link
              href={`/experiences/${item.slug}`}
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Back to experience
            </Link>
          </div>

          {selectedSlot ? (
            <div className="mt-6 rounded-3xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Selected time
              </p>
              <p className="mt-2 font-medium">
                {new Date(selectedSlot.starts_at).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {selectedSlot.spots_remaining} spots currently available
              </p>
            </div>
          ) : slot ? (
            <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm text-red-700">
              That time is no longer available.
            </div>
          ) : null}

          <div className="mt-8">
            <BookingRequestForm
              experienceId={item.id}
              slug={item.slug}
              slotId={selectedSlot?.id || null}
              defaultName={profile?.full_name || ""}
              defaultEmail={user?.email || ""}
            />
          </div>
        </div>
      </section>
    </main>
  );
}