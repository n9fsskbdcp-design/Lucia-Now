"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BookingRequestForm({
  experienceId,
  slug,
}: {
  experienceId: string;
  slug: string;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/bookings/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        experience_id: experienceId,
        name,
        email,
        guests,
        notes,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not send request");
      return;
    }

    toast.success("Request sent");
    router.push(`/book/${slug}/success`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <input
        type="text"
        placeholder="Your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border px-4 py-4"
        required
      />

      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border px-4 py-4"
        required
      />

      <input
        type="number"
        min={1}
        placeholder="Guests"
        value={guests}
        onChange={(e) => setGuests(Number(e.target.value))}
        className="w-full rounded-xl border px-4 py-4"
        required
      />

      <textarea
        placeholder="Anything the vendor should know?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        className="w-full rounded-xl border px-4 py-4"
      />

      <button
        disabled={loading}
        className="w-full rounded-xl bg-black py-4 text-white"
      >
        {loading ? "Sending..." : "Send Booking Request"}
      </button>
    </form>
  );
}