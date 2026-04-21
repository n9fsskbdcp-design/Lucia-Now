"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

type Slot = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  spots_remaining: number;
  status: string;
};

const durationOptions = [
  { label: "1 hour", minutes: 60 },
  { label: "90 mins", minutes: 90 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
  { label: "6 hours", minutes: 360 },
];

function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AvailabilityManager({
  experienceId,
  slots,
}: {
  experienceId: string;
  slots: Slot[];
}) {
  const [startAt, setStartAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [capacity, setCapacity] = useState(6);
  const [loading, setLoading] = useState(false);

  const endAt = useMemo(() => {
    if (!startAt) return "";
    const start = new Date(startAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return formatDateTimeLocal(end);
  }, [startAt, durationMinutes]);

  function quickSet(daysAhead: number, hour: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    date.setHours(hour, 0, 0, 0);
    setStartAt(formatDateTimeLocal(date));
  }

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/vendor/experiences/${experienceId}/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_at: startAt,
        end_at: endAt,
        capacity,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not create slot");
      return;
    }

    toast.success("Availability slot added");
    window.location.reload();
  }

  async function duplicateSlot(slot: Slot) {
    const start = new Date(slot.start_at);
    const end = new Date(slot.end_at);

    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);

    const res = await fetch(`/api/vendor/experiences/${experienceId}/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        capacity: slot.capacity,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not duplicate slot");
      return;
    }

    toast.success("Slot duplicated for next day");
    window.location.reload();
  }

  async function updateSlot(slotId: string, status: string) {
    const res = await fetch(`/api/vendor/experiences/${experienceId}/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slot_id: slotId,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not update slot");
      return;
    }

    toast.success("Slot updated");
    window.location.reload();
  }

  async function deleteSlot(slotId: string) {
    const res = await fetch(
      `/api/vendor/experiences/${experienceId}/availability?slot_id=${slotId}`,
      { method: "DELETE" },
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not delete slot");
      return;
    }

    toast.success("Slot deleted");
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">Add available time</h2>
        <p className="mt-2 text-neutral-600">
          Create a one-off slot now. Later we can add recurring schedules.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => quickSet(0, 10)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
            Today 10:00
          </button>
          <button type="button" onClick={() => quickSet(0, 14)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
            Today 14:00
          </button>
          <button type="button" onClick={() => quickSet(1, 9)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
            Tomorrow 09:00
          </button>
          <button type="button" onClick={() => quickSet(1, 15)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
            Tomorrow 15:00
          </button>
        </div>

        <form onSubmit={createSlot} className="mt-8 grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Start date & time
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Duration
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-xl border px-4 py-3"
            >
              {durationOptions.map((option) => (
                <option key={option.minutes} value={option.minutes}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Spots available
            </label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          <div className="md:col-span-3 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            <p>
              <strong>Ends at:</strong> {endAt ? new Date(endAt).toLocaleString() : "—"}
            </p>
          </div>

          <div className="md:col-span-3">
            <button
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              {loading ? "Adding..." : "Add availability"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">Upcoming slots</h2>

        {slots.length === 0 ? (
          <p className="mt-6 text-neutral-500">No availability added yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {slots.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-neutral-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-medium">
                      {new Date(slot.start_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Ends {new Date(slot.end_at).toLocaleString()}
                    </p>
                    <p className="mt-3 text-sm text-neutral-700">
                      Capacity {slot.capacity} · {slot.spots_remaining} spots remaining
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateSlot(slot)}
                      className="rounded-xl border px-4 py-2 text-sm"
                    >
                      Duplicate
                    </button>

                    {slot.status !== "open" ? (
                      <button
                        type="button"
                        onClick={() => updateSlot(slot.id, "open")}
                        className="rounded-xl border px-4 py-2 text-sm"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateSlot(slot.id, "sold_out")}
                        className="rounded-xl border px-4 py-2 text-sm"
                      >
                        Mark sold out
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => updateSlot(slot.id, "cancelled")}
                      className="rounded-xl border px-4 py-2 text-sm text-red-600"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSlot(slot.id)}
                      className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                  {slot.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}