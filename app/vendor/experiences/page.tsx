import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function VendorDashboard() {
  const { data: items } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">
              Vendor Dashboard
            </p>

            <h1 className="text-4xl font-semibold">
              Your Experiences
            </h1>
          </div>

          <Link
            href="/vendor/experiences/new"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Add Experience
          </Link>
        </div>

        <div className="mt-10 grid gap-5">
          {items?.map((item) => (
            <Link
              key={item.id}
              href={`/vendor/experiences/${item.id}`}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    {item.status}
                  </p>
                </div>

                <span className="text-sm font-medium">
                  Edit →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}