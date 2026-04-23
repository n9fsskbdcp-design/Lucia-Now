"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity_total: number;
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
  const [startsAt, setStartsAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [capacityTotal, setCapacityTotal] = useState(6);
  const [repeatMode, setRepeatMode] = useState<"once" | "daily" | "weekly">("once");
  const [repeatCount, setRepeatCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const endsAt = useMemo(() => {
    if (!startsAt) return "";
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return formatDateTimeLocal(end);
  }, [startsAt, durationMinutes]);

  function quickSet(daysAhead: number, hour: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    date.setHours(hour, 0, 0, 0);
    setStartsAt(formatDateTimeLocal(date));
  }

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (repeatMode === "once") {
      const res = await fetch(`/api/vendor/experiences/${experienceId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: startsAt,
          ends_at: endsAt,
          capacity_total: capacityTotal,
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
      return;
    }

    const intervalDays = repeatMode === "daily" ? 1 : 7;
    const start = new Date(startsAt);

    const rows = Array.from({ length: repeatCount }).map((_, index) => {
      const nextStart = new Date(start);
      nextStart.setDate(nextStart.getDate() + index * intervalDays);

      return {
        starts_at: nextStart.toISOString(),
        duration_minutes: durationMinutes,
        capacity_total: capacityTotal,
        weeks: 1,
      };
    });

    for (const row of rows) {
      const res = await fetch(`/api/vendor/experiences/${experienceId}/availability/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: row.starts_at,
          duration_minutes: row.duration_minutes,
          capacity_total: row.capacity_total,
          weeks: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        toast.error(data.error || "Could not create recurring slots");
        return;
      }
    }

    setLoading(false);
    toast.success(`${repeatMode === "daily" ? "Daily" : "Weekly"} slots added`);
    window.location.reload();
  }

  async function duplicateSlot(slot: Slot, daysToAdd: number) {
    const start = new Date(slot.starts_at);
    const end = new Date(slot.ends_at);

    start.setDate(start.getDate() + daysToAdd);
    end.setDate(end.getDate() + daysToAdd);

    const res = await fetch(`/api/vendor/experiences/${experienceId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        capacity_total: slot.capacity_total,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not duplicate slot");
      return;
    }

    toast.success(daysToAdd === 7 ? "Slot duplicated to next week" : "Slot duplicated");
    window.location.reload();
  }

  async function updateSlot(slotId: string, status: string) {
    const res = await fetch(`/api/vendor/experiences/${experienceId}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
          Create one-time, daily, or weekly availability.
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

        <form onSubmit={createSlot} className="mt-8 grid gap-5 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Start date & time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Duration</label>
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
            <label className="mb-2 block text-sm font-medium">Spots available</label>
            <input
              type="number"
              min={1}
              value={capacityTotal}
              onChange={(e) => setCapacityTotal(Number(e.target.value))}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Repeat</label>
            <select
              value={repeatMode}
              onChange={(e) => setRepeatMode(e.target.value as "once" | "daily" | "weekly")}
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="once">One time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {repeatMode !== "once" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Repeat count
              </label>
              <select
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value={2}>2 times</option>
                <option value={3}>3 times</option>
                <option value={5}>5 times</option>
                <option value={7}>7 times</option>
                <option value={14}>14 times</option>
              </select>
            </div>
          ) : null}

          <div className="md:col-span-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            <p>
              <strong>Ends at:</strong> {endsAt ? new Date(endsAt).toLocaleString() : "—"}
            </p>
          </div>

          <div className="md:col-span-4">
            <button disabled={loading} className="rounded-xl bg-black px-5 py-3 text-white">
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
                      {new Date(slot.starts_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Ends {new Date(slot.ends_at).toLocaleString()}
                    </p>
                    <p className="mt-3 text-sm text-neutral-700">
                      Capacity {slot.capacity_total} · {slot.spots_remaining} spots remaining
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateSlot(slot, 1)}
                      className="rounded-xl border px-4 py-2 text-sm"
                    >
                      Next day
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateSlot(slot, 7)}
                      className="rounded-xl border px-4 py-2 text-sm"
                    >
                      Next week
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