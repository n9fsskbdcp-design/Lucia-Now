"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Mode = "create" | "edit";

type InitialValues = {
  title?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  base_price?: number;
  base_price_type?: string;
  booking_mode?: string;
  min_guests?: number;
  max_guests?: number | null;
  status?: string;
  is_active?: boolean;
};

export default function ExperienceForm({
  mode,
  experienceId,
  initialValues,
}: {
  mode: Mode;
  experienceId?: string;
  initialValues?: InitialValues;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title || "");
  const [slug, setSlug] = useState(initialValues?.slug || "");
  const [shortDescription, setShortDescription] = useState(
    initialValues?.short_description || "",
  );
  const [description, setDescription] = useState(initialValues?.description || "");
  const [basePrice, setBasePrice] = useState(String(initialValues?.base_price || ""));
  const [basePriceType, setBasePriceType] = useState(
    initialValues?.base_price_type || "per_person",
  );
  const [bookingMode, setBookingMode] = useState(
    initialValues?.booking_mode || "request",
  );
  const [minGuests, setMinGuests] = useState(String(initialValues?.min_guests || 1));
  const [maxGuests, setMaxGuests] = useState(
    initialValues?.max_guests ? String(initialValues.max_guests) : "",
  );
  const [status, setStatus] = useState(initialValues?.status || "draft");
  const [isActive, setIsActive] = useState(Boolean(initialValues?.is_active));
  const [loading, setLoading] = useState(false);

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function updateTitle(value: string) {
    setTitle(value);

    if (mode === "create" || !slug) {
      setSlug(makeSlug(value));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title,
      slug,
      short_description: shortDescription,
      description,
      base_price: Number(basePrice),
      base_price_type: basePriceType,
      booking_mode: bookingMode,
      min_guests: Number(minGuests),
      max_guests: maxGuests ? Number(maxGuests) : null,
      status,
      is_active: isActive,
    };

    const url =
      mode === "edit" && experienceId
        ? `/api/vendor/experiences/${experienceId}`
        : "/api/vendor/experiences";

    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not save experience");
      return;
    }

    toast.success(mode === "edit" ? "Experience updated" : "Experience created");

    if (mode === "create") {
      router.push(`/vendor/experiences/${data.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <p className="text-sm font-medium text-neutral-500">Basics</p>
        <h2 className="mt-1 text-2xl font-semibold">Listing details</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Keep the title clear, searchable, and easy for travelers to understand.
        </p>

        <div className="mt-5 grid gap-4">
          <Field
            label="Experience title"
            value={title}
            setValue={updateTitle}
            placeholder="Private airport transfer"
            required
          />

          <Field
            label="URL slug"
            value={slug}
            setValue={setSlug}
            placeholder="private-airport-transfer"
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium">
              Short description
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              placeholder="A short summary shown on cards and search results..."
              className="w-full rounded-3xl border px-4 py-4 text-sm leading-6"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Full description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Describe the experience, pickup details, what is included, and what guests should know..."
              className="w-full rounded-3xl border px-4 py-4 text-sm leading-6"
              required
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-neutral-50 p-5">
        <p className="text-sm font-medium text-neutral-500">Pricing</p>
        <h2 className="mt-1 text-xl font-semibold">Booking setup</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Base price"
            value={basePrice}
            setValue={setBasePrice}
            placeholder="120"
            type="number"
            required
          />

          <Select
            label="Price type"
            value={basePriceType}
            setValue={setBasePriceType}
            options={[
              ["per_person", "Per person"],
              ["per_group", "Per group"],
            ]}
          />

          <Select
            label="Booking mode"
            value={bookingMode}
            setValue={setBookingMode}
            options={[
              ["request", "Request to book"],
              ["instant", "Instant book"],
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Min guests"
              value={minGuests}
              setValue={setMinGuests}
              placeholder="1"
              type="number"
              required
            />

            <Field
              label="Max guests"
              value={maxGuests}
              setValue={setMaxGuests}
              placeholder="Optional"
              type="number"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-neutral-50 p-5">
        <p className="text-sm font-medium text-neutral-500">Visibility</p>
        <h2 className="mt-1 text-xl font-semibold">Marketplace status</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            setValue={setStatus}
            options={[
              ["draft", "Draft"],
              ["published", "Published"],
              ["archived", "Archived"],
            ]}
          />

          <label className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div>
              <p className="text-sm font-medium">Active listing</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Active and published listings can appear publicly.
              </p>
            </div>

            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-800"
        >
          Cancel
        </button>

        <button
          disabled={loading}
          className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : mode === "edit"
              ? "Save changes"
              : "Create experience"}
        </button>
      </div>
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
        required={required}
        className="w-full rounded-2xl border px-4 py-4"
      />
    </div>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-2xl border px-4 py-4"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}