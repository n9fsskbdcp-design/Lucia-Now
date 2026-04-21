import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

type VendorRow = {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  is_verified: boolean;
  verification_status: string;
  is_live: boolean;
};

type ExperienceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  base_price: number;
  base_price_type: "per_person" | "per_group";
};

type ImageRow = {
  id: string;
  experience_id: string;
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

export default async function VendorProfilePage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await props.params;

  const { data: vendorData } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .eq("slug", slug)
    .single();

  const vendor = (vendorData ?? null) as VendorRow | null;

  if (!vendor || !vendor.is_live) notFound();

  const { data: experienceData } = await supabaseAdmin
    .from("experiences")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      base_price,
      base_price_type
    `
    )
    .eq("vendor_id", vendor.id)
    .eq("status", "published")
    .eq("is_active", true)
    .order("featured_score", { ascending: false });

  const experiences = (experienceData ?? []) as ExperienceRow[];

  const ids = experiences.map((x) => x.id);

  const { data: imageData } = await supabaseAdmin
    .from("experience_images")
    .select("*")
    .in("experience_id", ids);

  const images = (imageData ?? []) as ImageRow[];

  function cover(id: string) {
    const coverImage =
      images.find(
        (img) => img.experience_id === id && img.is_cover === true,
      ) || images.find((img) => img.experience_id === id);

    return (
      coverImage?.image_url ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          {vendor.is_verified ? (
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              Verified Partner
            </span>
          ) : null}

          <h1 className="mt-5 text-5xl font-semibold">
            {vendor.business_name}
          </h1>

          <p className="mt-6 text-lg text-neutral-600">
            {vendor.description || "Lucia Now partner in St Lucia."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-3xl font-semibold">Experiences by this partner</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {experiences.map((item) => (
            <Link
              key={item.id}
              href={`/experiences/${item.slug}`}
              className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={cover(item.id)}
                alt={item.title}
                className="h-64 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>

                <p className="mt-3 line-clamp-2 text-sm text-neutral-500">
                  {item.short_description}
                </p>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">From</p>
                    <p className="text-2xl font-semibold">${item.base_price}</p>
                  </div>

                  <span className="rounded-xl bg-black px-4 py-2 text-sm text-white">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}