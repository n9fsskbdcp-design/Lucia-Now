"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Clock, Copy, Trash2 } from "lucide-react";
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

      toast.success("Availability added");
      window.location.reload();
      return;
    }

    const intervalDays = repeatMode === "daily" ? 1 : 7;
    const start = new Date(startsAt);

    for (let index = 0; index < repeatCount; index += 1) {
      const nextStart = new Date(start);
      nextStart.setDate(nextStart.getDate() + index * intervalDays);

      const res = await fetch(`/api/vendor/experiences/${experienceId}/availability/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: nextStart.toISOString(),
          duration_minutes: durationMinutes,
          capacity_total: capacityTotal,
          weeks: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        toast.error(data.error || "Could not create repeating slots");
        return;
      }
    }

    setLoading(false);
    toast.success("Repeating availability added");
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

    toast.success(daysToAdd === 7 ? "Duplicated to next week" : "Duplicated to next day");
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
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
            <CalendarPlus size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Add available time</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Create a single slot or repeat the same slot daily or weekly.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {[
            ["Today 10:00", 0, 10],
            ["Today 14:00", 0, 14],
            ["Tomorrow 09:00", 1, 9],
            ["Tomorrow 15:00", 1, 15],
          ].map(([label, days, hour]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => quickSet(Number(days), Number(hour))}
              className="shrink-0 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={createSlot} className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium">Start date & time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Duration</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-2xl border px-4 py-3"
            >
              {durationOptions.map((option) => (
                <option key={option.minutes} value={option.minutes}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Spots</label>
            <input
              type="number"
              min={1}
              value={capacityTotal}
              onChange={(e) => setCapacityTotal(Number(e.target.value))}
              className="w-full rounded-2xl border px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Repeat</label>
            <select
              value={repeatMode}
              onChange={(e) => setRepeatMode(e.target.value as "once" | "daily" | "weekly")}
              className="w-full rounded-2xl border px-4 py-3"
            >
              <option value="once">One time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {repeatMode !== "once" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">How many?</label>
              <select
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="w-full rounded-2xl border px-4 py-3"
              >
                <option value={2}>2 times</option>
                <option value={3}>3 times</option>
                <option value={5}>5 times</option>
                <option value={7}>7 times</option>
                <option value={14}>14 times</option>
              </select>
            </div>
          ) : null}

          <div className="rounded-3xl bg-neutral-50 p-4 lg:col-span-4">
            <p className="flex items-center text-sm text-neutral-600">
              <Clock className="mr-2" size={17} />
              Ends at:{" "}
              <strong className="ml-1 text-neutral-950">
                {endsAt ? new Date(endsAt).toLocaleString() : "—"}
              </strong>
            </p>
          </div>

          <div className="lg:col-span-4">
            <button
              disabled={loading}
              className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add availability"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
        <h2 className="text-2xl font-semibold">Upcoming slots</h2>

        {slots.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-neutral-50 p-5 text-sm text-neutral-500">
            No availability added yet.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="rounded-3xl bg-neutral-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">
                      {new Date(slot.starts_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Ends {new Date(slot.ends_at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-neutral-700">
                      {slot.spots_remaining}/{slot.capacity_total} spots remaining
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateSlot(slot, 1)}
                      className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5"
                    >
                      <Copy className="mr-2" size={15} />
                      Next day
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateSlot(slot, 7)}
                      className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5"
                    >
                      <Copy className="mr-2" size={15} />
                      Next week
                    </button>

                    {slot.status !== "open" ? (
                      <button
                        type="button"
                        onClick={() => updateSlot(slot.id, "open")}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateSlot(slot.id, "sold_out")}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5"
                      >
                        Sold out
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteSlot(slot.id)}
                      className="inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
                    >
                      <Trash2 className="mr-2" size={15} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
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