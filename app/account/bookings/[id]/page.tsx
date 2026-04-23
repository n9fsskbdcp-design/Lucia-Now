import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AccountBookingDetailPage(
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

  const { data: request } = await supabaseAdmin
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
    .eq("user_id", user.id)
    .single();

  if (!request) notFound();

  const timeline = [
    { label: "Request sent", active: true },
    { label: "Vendor contacted", active: ["contacted", "confirmed"].includes(request.contact_status) },
    { label: "Booking confirmed", active: request.status === "confirmed" },
  ];

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Booking detail</p>
            <h1 className="mt-2 text-4xl font-semibold">
              {request.experiences?.title || "Booking"}
            </h1>
          </div>

          <Link href="/account" className="rounded-xl border px-5 py-3">
            Back to account
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Progress</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {timeline.map((step) => (
              <div
                key={step.label}
                className={`rounded-2xl p-4 ${
                  step.active ? "bg-green-50 text-green-800" : "bg-neutral-50 text-neutral-500"
                }`}
              >
                <p className="font-medium">{step.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3 text-neutral-700">
            <p><strong>Guests:</strong> {request.guests}</p>
            <p><strong>Status:</strong> {request.status}</p>
            <p><strong>Contact status:</strong> {request.contact_status}</p>
            {request.requested_start_at ? (
              <p>
                <strong>Requested slot:</strong>{" "}
                {new Date(request.requested_start_at).toLocaleString()}
              </p>
            ) : null}
          </div>

          {request.notes ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-medium">Your notes</p>
              <p className="mt-2 text-sm text-neutral-600">{request.notes}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}