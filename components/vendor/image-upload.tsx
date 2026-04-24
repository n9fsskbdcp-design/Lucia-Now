"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ImageUpload({
  experienceId,
}: {
  experienceId: string;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/vendor/experiences/${experienceId}/images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        alt_text: altText || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not add image");
      return;
    }

    toast.success("Image added");
    setImageUrl("");
    setAltText("");
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-3xl bg-neutral-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <ImagePlus size={20} />
          </div>

          <div>
            <p className="font-medium">Add image by URL</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Use a high-quality landscape image. Upload storage can be added later.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-2xl border px-4 py-4"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Alt text</label>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe the image"
          className="w-full rounded-2xl border px-4 py-4"
        />
      </div>

      <button
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={16} />
            Adding...
          </>
        ) : (
          "Add image"
        )}
      </button>
    </form>
  );
}