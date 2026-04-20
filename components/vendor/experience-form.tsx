"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  experienceSchema,
  ExperienceFormValues,
} from "@/lib/validation/experience";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  mode: "create" | "edit";
  experienceId?: string;
  initialValues?: Partial<ExperienceFormValues>;
};

export default function ExperienceForm({
  mode,
  experienceId,
  initialValues,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      short_description: "",
      description: "",
      booking_mode: "instant",
      duration_minutes: 180,
      cutoff_minutes: 120,
      min_guests: 1,
      max_guests: 8,
      base_price: 150,
      base_currency: "USD",
      base_price_type: "per_person",
      category_id: null,
      primary_location_id: null,
      status: "draft",
      is_active: false,
      ...initialValues,
    },
  });

  const title = watch("title");
  const price = watch("base_price");
  const status = watch("status");

  async function submit(values: ExperienceFormValues) {
    setServerError("");

    const endpoint =
      mode === "create"
        ? "/api/vendor/experiences"
        : `/api/vendor/experiences/${experienceId}`;

    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error || "Unable to save");
      toast.error("Unable to save listing");
      return;
    }

    if (mode === "create") {
      toast.success("Experience created");
      router.push(`/vendor/experiences/${data.id}`);
      return;
    }

    toast.success("Changes saved");
    router.push("/vendor/experiences");
  }

  function publish() {
    setValue("status", "published");
    setValue("is_active", true);
  }

  function draft() {
    setValue("status", "draft");
    setValue("is_active", false);
  }

  function pause() {
    setValue("status", "paused");
    setValue("is_active", false);
  }

  function archive() {
    setValue("status", "archived");
    setValue("is_active", false);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="grid gap-8 lg:grid-cols-[1fr_340px]"
    >
      {/* LEFT */}
      <div className="space-y-6">
        <Section title="Experience Details">
          <Input label="Title" register={register("title")} />
          <Input
            label="Tagline"
            register={register("subtitle")}
          />

          <Textarea
            label="Short Description"
            rows={3}
            register={register("short_description")}
          />

          <Textarea
            label="Full Description"
            rows={7}
            register={register("description")}
          />
        </Section>

        <Section title="Pricing">
          <Grid2>
            <Input
              label="Starting Price (USD)"
              type="number"
              register={register("base_price", {
                valueAsNumber: true,
              })}
            />

            <Select
              label="Charge Type"
              register={register("base_price_type")}
              options={[
                ["per_person", "Per Person"],
                ["per_group", "Per Group"],
              ]}
            />
          </Grid2>
        </Section>

        <Section title="Booking Setup">
          <Grid2>
            <Select
              label="Booking Type"
              register={register("booking_mode")}
              options={[
                ["instant", "Instant Booking"],
                ["request", "Request Approval"],
              ]}
            />

            <Input
              label="Duration (mins)"
              type="number"
              register={register("duration_minutes", {
                valueAsNumber: true,
              })}
            />
          </Grid2>

          <Input
            label="Latest Booking Cutoff (mins)"
            type="number"
            register={register("cutoff_minutes", {
              valueAsNumber: true,
            })}
          />
        </Section>

        <Section title="Guest Capacity">
          <Grid2>
            <Input
              label="Minimum Guests"
              type="number"
              register={register("min_guests", {
                valueAsNumber: true,
              })}
            />

            <Input
              label="Maximum Guests"
              type="number"
              register={register("max_guests", {
                valueAsNumber: true,
              })}
            />
          </Grid2>
        </Section>
      </div>

      {/* RIGHT */}
      <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">
          Listing Control
        </h2>

        <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm">
          <p>
            <strong>Title:</strong>{" "}
            {title || "Untitled"}
          </p>

          <p className="mt-2">
            <strong>Status:</strong> {status}
          </p>

          <p className="mt-2">
            <strong>Price:</strong> USD ${price || 0}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={draft}
            className="w-full rounded-xl border px-4 py-3"
          >
            Draft
          </button>

          <button
            type="button"
            onClick={publish}
            className="w-full rounded-xl bg-black px-4 py-3 text-white"
          >
            Publish
          </button>

          <button
            type="button"
            onClick={pause}
            className="w-full rounded-xl border px-4 py-3"
          >
            Pause
          </button>

          <button
            type="button"
            onClick={archive}
            className="w-full rounded-xl border px-4 py-3 text-red-600"
          >
            Archive
          </button>
        </div>

        {serverError && (
          <p className="mt-4 text-sm text-red-600">
            {serverError}
          </p>
        )}

        {Object.keys(errors).length > 0 && (
          <p className="mt-4 text-sm text-red-600">
            Please review required fields.
          </p>
        )}

        <button
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-4 text-white"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
            ? "Create Experience"
            : "Save Changes"}
        </button>
      </aside>
    </form>
  );
}

/* UI HELPERS */

function Section({
  title,
  children,
}: any) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Grid2({ children }: any) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {children}
    </div>
  );
}

function Input({
  label,
  register,
  type = "text",
}: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        type={type}
        {...register}
        className="w-full rounded-xl border p-3"
      />
    </div>
  );
}

function Textarea({
  label,
  register,
  rows,
}: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <textarea
        rows={rows}
        {...register}
        className="w-full rounded-xl border p-3"
      />
    </div>
  );
}

function Select({
  label,
  register,
  options,
}: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <select
        {...register}
        className="w-full rounded-xl border p-3"
      >
        {options.map(([v, l]: any) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}