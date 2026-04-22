import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function VendorLeadDetailPage(
  props: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    redirect("/");
  }

  const { data: vendor } = await supabaseAdmin
    .from("vendors")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const { data: lead } = await supabaseAdmin
    .from("booking_requests")
    .select(
      `
      *,
      experiences (
        title,
        slug
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!lead) notFound();

  if (profile?.role !== "admin" && lead.vendor_id !== vendor?.id) {
    redirect("/vendor");
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Lead Detail</p>
            <h1 className="mt-2 text-4xl font-semibold">
              {lead.experiences?.title || "Booking lead"}
            </h1>
          </div>

          <div className="flex gap-3">
            <Link href="/vendor" className="rounded-xl border px-5 py-3">
              Back to dashboard
            </Link>

            {lead.experiences?.slug ? (
              <Link
                href={`/experiences/${lead.experiences.slug}`}
                className="rounded-xl bg-black px-5 py-3 text-white"
              >
                View public page
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Guest</h2>

            <div className="mt-5 space-y-3 text-neutral-700">
              <p><strong>Name:</strong> {lead.guest_name}</p>
              <p><strong>Email:</strong> {lead.guest_email}</p>
              <p><strong>Guests:</strong> {lead.guests}</p>
            </div>

            {lead.notes ? (
              <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm font-medium">Notes</p>
                <p className="mt-2 text-sm text-neutral-600">{lead.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Booking</h2>

            <div className="mt-5 space-y-3 text-neutral-700">
              <p><strong>Status:</strong> {lead.status}</p>
              <p><strong>Contact status:</strong> {lead.contact_status}</p>
              {lead.requested_start_at ? (
                <p>
                  <strong>Requested slot:</strong>{" "}
                  {new Date(lead.requested_start_at).toLocaleString()}
                </p>
              ) : null}
              {lead.requested_end_at ? (
                <p>
                  <strong>Requested end:</strong>{" "}
                  {new Date(lead.requested_end_at).toLocaleString()}
                </p>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                <input type="hidden" name="contact_status" value="contacted" />
                <button className="rounded-xl border px-5 py-3">
                  Mark contacted
                </button>
              </form>

              <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                <input type="hidden" name="contact_status" value="confirmed" />
                <button className="rounded-xl bg-black px-5 py-3 text-white">
                  Confirm
                </button>
              </form>

              <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                <input type="hidden" name="contact_status" value="declined" />
                <button className="rounded-xl border px-5 py-3 text-red-600">
                  Decline
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}