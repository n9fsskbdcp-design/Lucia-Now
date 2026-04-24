import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";
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
    <main className="page-shell">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/vendor/experiences/${id}/availability`}
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to availability
        </Link>

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <CalendarDays size={28} className="text-white/70" />
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Calendar
          </h1>
          <p className="mt-3 max-w-xl text-white/65">
            {experience.title}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {grouped.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center text-neutral-500 shadow-sm ring-1 ring-black/5">
              No upcoming slots yet.
            </div>
          ) : (
            grouped.map((group) => (
              <section
                key={group.date}
                className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8"
              >
                <h2 className="text-2xl font-semibold">{group.date}</h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-3xl bg-neutral-50 p-4"
                    >
                      <p className="font-semibold">
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

                      <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
                        {slot.status}
                      </div>

                      <form
                        action={`/api/vendor/slots/${slot.id}/inventory`}
                        method="post"
                        className="mt-4 flex gap-2"
                      >
                        <input
                          type="number"
                          name="spots_remaining"
                          min={0}
                          max={slot.capacity_total}
                          defaultValue={slot.spots_remaining}
                          className="w-full rounded-2xl border bg-white px-3 py-2 text-sm"
                        />
                        <button className="rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                          Save
                        </button>
                      </form>
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

    if (!map.has(date)) map.set(date, []);

    map.get(date)!.push(slot);
  }

  return Array.from(map.entries()).map(([date, slots]) => ({
    date,
    slots,
  }));
}