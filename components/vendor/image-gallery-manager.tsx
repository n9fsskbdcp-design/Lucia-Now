"use client";

import { toast } from "sonner";

type ImageRow = {
  id: string;
  image_url: string;
  is_cover: boolean | null;
};

export default function ImageGalleryManager({
  experienceId,
  images,
}: {
  experienceId: string;
  images: ImageRow[];
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

  async function deleteImage(imageId: string) {
    const res = await fetch(
      `/api/vendor/experiences/${experienceId}/images/${imageId}`,
      {
        method: "DELETE",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not delete image");
      return;
    }

    toast.success("Image deleted");
    window.location.reload();
  }

  if (images.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-500">
        No images uploaded yet.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="overflow-hidden rounded-2xl border border-neutral-200"
        >
          <img
            src={img.image_url}
            alt=""
            className="h-40 w-full object-cover"
          />

          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              {img.is_cover ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Cover image
                </span>
              ) : (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                  Gallery image
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {!img.is_cover ? (
                <button
                  type="button"
                  onClick={() => setCover(img.id)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  Set cover
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => deleteImage(img.id)}
                className="rounded-xl bg-black px-3 py-2 text-sm text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}