"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const options = [
  "Boat Trips",
  "Island Tours",
  "Private Drivers",
  "Airport Transfers",
  "Snorkeling",
  "Sunset Cruises",
];

export default function PartnerApplicationForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [experienceTypes, setExperienceTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleType(value: string) {
    setExperienceTypes((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [...prev, value],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/vendor/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        business_name: businessName,
        email,
        phone,
        website,
        instagram,
        experience_types: experienceTypes,
        notes,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not submit application");
      return;
    }

    toast.success("Application submitted");
    router.push("/partners?submitted=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border px-4 py-4"
          required
        />

        <input
          type="text"
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-xl border px-4 py-4"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border px-4 py-4"
          required
        />

        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border px-4 py-4"
        />

        <input
          type="text"
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full rounded-xl border px-4 py-4"
        />

        <input
          type="text"
          placeholder="Instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="w-full rounded-xl border px-4 py-4"
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-neutral-700">
          What do you offer?
        </p>

        <div className="flex flex-wrap gap-3">
          {options.map((option) => {
            const active = experienceTypes.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleType(option)}
                className={`rounded-full px-4 py-2 text-sm ${
                  active
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        placeholder="Tell us about your business, service area, fleet, guides, availability, and what makes your offering special."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        className="w-full rounded-xl border px-4 py-4"
      />

      <button
        disabled={loading}
        className="w-full rounded-xl bg-black py-4 text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Partner Application"}
      </button>
    </form>
  );
}