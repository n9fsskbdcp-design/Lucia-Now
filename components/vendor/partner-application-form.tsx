"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function PartnerApplicationForm() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/partners/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        contact_name: contactName,
        email,
        phone,
        business_type: businessType,
        description,
        website,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not submit application");
      return;
    }

    toast.success("Application submitted");
    setBusinessName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setBusinessType("");
    setDescription("");
    setWebsite("");
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <Field
        label="Business name"
        value={businessName}
        setValue={setBusinessName}
        placeholder="Example: Island Luxury Tours"
        required
      />

      <Field
        label="Contact name"
        value={contactName}
        setValue={setContactName}
        placeholder="Your full name"
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Email"
          type="email"
          value={email}
          setValue={setEmail}
          placeholder="you@example.com"
          required
        />

        <Field
          label="Phone"
          value={phone}
          setValue={setPhone}
          placeholder="+1 758..."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Business type</label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full rounded-2xl border px-4 py-4"
          required
        >
          <option value="">Select type</option>
          <option value="tour_operator">Tour operator</option>
          <option value="boat_operator">Boat operator</option>
          <option value="driver_transport">Driver / transport</option>
          <option value="wellness">Wellness</option>
          <option value="restaurant">Restaurant / hospitality</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Field
        label="Website or social link"
        value={website}
        setValue={setWebsite}
        placeholder="Instagram, website, or booking page"
      />

      <div>
        <label className="mb-2 block text-sm font-medium">
          What do you offer?
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe your experiences, services, and ideal guests..."
          className="w-full rounded-3xl border px-4 py-4 text-sm leading-6"
          required
        />
      </div>

      <button
        disabled={loading}
        className="w-full rounded-full bg-neutral-950 py-4 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit application"}
      </button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        Submitting an application does not automatically make your listing live.
        Admin approval is required.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border px-4 py-4"
        required={required}
      />
    </div>
  );
}