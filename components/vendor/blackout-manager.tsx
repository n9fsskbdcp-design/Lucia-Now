"use client";

import { useState } from "react";
import { CalendarX } from "lucide-react";
import { toast } from "sonner";

type Blackout = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export default function BlackoutManager({
  experienceId,
  blackouts,
}: {
  experienceId: string;
  blackouts: Blackout[];
}) {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");

  async function createBlackout(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`/api/vendor/experiences/${experienceId}/blackouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        starts_at: startsAt,
        ends_at: endsAt,
        reason,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not add blackout");
      return;
    }

    toast.success("Blackout added");
    window.location.reload();
  }

  async function deleteBlackout(id: string) {
    const res = await fetch(
      `/api/vendor/experiences/${experienceId}/blackouts?blackout_id=${id}`,
      { method: "DELETE" },
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not delete blackout");
      return;
    }

    toast.success("Blackout removed");
    window.location.reload();
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
          <CalendarX size={22} />
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Closed dates</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Block days or time ranges when this experience should not be bookable.
          </p>
        </div>
      </div>

      <form onSubmit={createBlackout} className="mt-6 grid gap-4 lg:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium">Starts</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Ends</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div className="lg:col-span-3">
          <button className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white">
            Add closed time
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {blackouts.length === 0 ? (
          <div className="rounded-3xl bg-neutral-50 p-5 text-sm text-neutral-500">
            No closed dates yet.
          </div>
        ) : (
          blackouts.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-3xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {new Date(item.starts_at).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  to {new Date(item.ends_at).toLocaleString()}
                </p>
                {item.reason ? (
                  <p className="mt-1 text-sm text-neutral-600">{item.reason}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => deleteBlackout(item.id)}
                className="w-fit rounded-full bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-black/5"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}