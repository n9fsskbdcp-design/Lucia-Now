import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronLeft, Eye, Image as ImageIcon } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ExperienceForm from "@/components/vendor/experience-form";
import ImageUpload from "@/components/vendor/image-upload";
import ImageGalleryManager from "@/components/vendor/image-gallery-manager";

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

  if (!experience) notFound();

  const { data: images } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .eq("experience_id", id)
    .order("sort_order", { ascending: true });

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/vendor/experiences"
          className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-black/5"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to experiences
        </Link>

        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm text-white/55">Edit listing</p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                {experience.title || "Experience"}
              </h1>
              <p className="mt-2 max-w-xl text-white/65">
                Update listing details, upload images, and manage availability.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/vendor/experiences/${id}/availability`}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950"
              >
                <CalendarDays className="mr-2" size={17} />
                Availability
              </Link>

              {experience.slug ? (
                <Link
                  href={`/experiences/${experience.slug}`}
                  className="inline-flex rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15"
                >
                  <Eye className="mr-2" size={17} />
                  Public page
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
            <ExperienceForm
              mode="edit"
              experienceId={id}
              initialValues={experience}
            />
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
                  <ImageIcon size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">Images</h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Add photos and choose a cover image for the public page.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <ImageUpload experienceId={id} />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
              <h2 className="text-xl font-semibold">Current images</h2>

              <div className="mt-5">
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
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}