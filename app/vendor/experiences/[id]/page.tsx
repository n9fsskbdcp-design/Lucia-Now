import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ExperienceForm from "@/components/vendor/experience-form";
import ImageUpload from "@/components/vendor/image-upload";
import ImageGalleryManager from "@/components/vendor/image-gallery-manager";
import Link from "next/link";

export default async function VendorEditExperiencePage(
  props: {
    params: Promise<{ id: string }>;
  },
) {
  await requireRole(["vendor", "admin"]);

  const { id } = await props.params;

  const { data: experience } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("id", id)
    .single();

  if (!experience) {
    notFound();
  }

  const { data: images } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .eq("experience_id", id)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-neutral-50 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">
            Edit Experience
          </h1>

          <Link
            href={`/vendor/experiences/${id}/availability`}
            className="rounded-xl border px-5 py-3"
          >
            Manage Availability
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <ExperienceForm
              mode="edit"
              experienceId={id}
              initialValues={experience}
            />
          </div>

          <div className="space-y-6">
            <ImageUpload experienceId={id} />

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Current Images</h2>

              <ImageGalleryManager
                experienceId={id}
                images={
                  (images ?? []).map((img) => ({
                    id: img.id,
                    image_url: img.image_url,
                    is_cover: img.is_cover,
                  }))
                }
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}