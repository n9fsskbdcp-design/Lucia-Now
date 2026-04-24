"use client";

import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ImageItem = {
  id: string;
  image_url: string;
  is_cover: boolean | null;
};

export default function ImageGalleryManager({
  experienceId,
  images,
}: {
  experienceId: string;
  images: ImageItem[];
}) {
  async function setCover(imageId: string) {
    const res = await fetch(
      `/api/vendor/experiences/${experienceId}/images/${imageId}/cover`,
      {
        method: "POST",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not set cover image");
      return;
    }

    toast.success("Cover image updated");
    window.location.reload();
  }

  async function remove(imageId: string) {
    const res = await fetch(
      `/api/vendor/experiences/${experienceId}/images/${imageId}`,
      {
        method: "DELETE",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not remove image");
      return;
    }

    toast.success("Image removed");
    window.location.reload();
  }

  if (images.length === 0) {
    return (
      <div className="rounded-3xl bg-neutral-50 p-6 text-center">
        <p className="font-medium">No images yet</p>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Add at least one strong photo before sharing this listing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {images.map((image) => (
        <article
          key={image.id}
          className="overflow-hidden rounded-3xl bg-neutral-50 shadow-sm ring-1 ring-black/5"
        >
          <div className="relative">
            <img
              src={image.image_url}
              alt=""
              className="h-44 w-full object-cover"
            />

            {image.is_cover ? (
              <span className="absolute left-3 top-3 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                Cover
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <button
              type="button"
              onClick={() => setCover(image.id)}
              disabled={Boolean(image.is_cover)}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm ring-1 ring-black/5 disabled:opacity-50"
            >
              <Star className="mr-2" size={15} />
              Cover
            </button>

            <button
              type="button"
              onClick={() => remove(image.id)}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-black/5"
            >
              <Trash2 className="mr-2" size={15} />
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}