"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

export default function ImageUpload({
  experienceId,
}: {
  experienceId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();

    setLoading(true);

    const filePath = `${experienceId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("experience-images")
      .upload(filePath, file);

    if (error) {
      toast.error("Upload failed");
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("experience-images")
      .getPublicUrl(filePath);

    await fetch(
      `/api/vendor/experiences/${experienceId}/images`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: data.publicUrl,
        }),
      }
    );

    toast.success("Image uploaded");
    location.reload();
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">
        Experience Images
      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={loading}
        className="mt-4 block w-full"
      />

      {loading && (
        <p className="mt-3 text-sm text-neutral-500">
          Uploading...
        </p>
      )}
    </div>
  );
}