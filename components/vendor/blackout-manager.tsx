"use client";

import { useState } from "react";
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
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Blackout dates</h2>
      <p className="mt-2 text-neutral-600">
        Block dates when this experience should not be bookable.
      </p>

      <form onSubmit={createBlackout} className="mt-6 grid gap-4 md:grid-cols-3">
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-xl border px-4 py-3"
          required
        />
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="rounded-xl border px-4 py-3"
          required
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="rounded-xl border px-4 py-3"
        />

        <div className="md:col-span-3">
          <button className="rounded-xl bg-black px-5 py-3 text-white">
            Add blackout
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {blackouts.length === 0 ? (
          <p className="text-neutral-500">No blackout dates yet.</p>
        ) : (
          blackouts.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">
                  {new Date(item.starts_at).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-500">
                  to {new Date(item.ends_at).toLocaleString()}
                </p>
                {item.reason ? (
                  <p className="mt-1 text-sm text-neutral-600">{item.reason}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => deleteBlackout(item.id)}
                className="rounded-xl border px-4 py-2 text-red-600"
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