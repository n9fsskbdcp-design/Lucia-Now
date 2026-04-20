import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ExperienceForm from "@/components/vendor/experience-form";
import ImageUpload from "@/components/vendor/image-upload";

export default async function VendorEditExperiencePage(
  props: {
    params: Promise<{ id: string }>;
  }
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
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_360px]">
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

            {!images || images.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                No images uploaded yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                {images.map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt=""
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}