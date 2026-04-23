import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity_total: number;
  spots_remaining: number;
  status: string;
};

export default async function VendorCalendarPage(
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

  const { data: slots } = await supabaseAdmin
    .from("availability_slots")
    .select("*")
    .eq("experience_id", id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const grouped = groupByDay((slots ?? []) as Slot[]);

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Calendar</p>
            <h1 className="mt-2 text-4xl font-semibold">{experience.title}</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/vendor/experiences/${id}/availability`}
              className="rounded-xl border px-5 py-3"
            >
              Availability
            </Link>
            <Link
              href={`/vendor/experiences/${id}`}
              className="rounded-xl border px-5 py-3"
            >
              Listing
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {grouped.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm text-neutral-500">
              No upcoming slots yet.
            </div>
          ) : (
            grouped.map((group) => (
              <section key={group.date} className="rounded-3xl bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold">{group.date}</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.slots.map((slot) => (
                    <div key={slot.id} className="rounded-2xl bg-neutral-50 p-5">
                      <p className="font-medium">
                        {new Date(slot.starts_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" — "}
                        {new Date(slot.ends_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      <p className="mt-2 text-sm text-neutral-500">
                        {slot.spots_remaining}/{slot.capacity_total} spots left
                      </p>

                      <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs">
                        {slot.status}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function groupByDay(slots: Slot[]) {
  const map = new Map<string, Slot[]>();

  for (const slot of slots) {
    const date = new Date(slot.starts_at).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (!map.has(date)) {
      map.set(date, []);
    }

    map.get(date)!.push(slot);
  }

  return Array.from(map.entries()).map(([date, slots]) => ({
    date,
    slots,
  }));
}