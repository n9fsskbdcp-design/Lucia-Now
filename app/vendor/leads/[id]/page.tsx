import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MessageThread from "@/components/booking/message-thread";

function prettyStatus(label: string) {
  if (label === "confirmed_pending_payment") return "Awaiting payment";
  if (label === "paid_confirmed") return "Paid & confirmed";
  if (label === "contacted") return "Contacted";
  if (label === "declined") return "Declined";
  return label;
}

function actionMessage(status: string, paymentStatus: string) {
  if (status === "confirmed_pending_payment") {
    return "You accepted this request. The traveler now needs to complete payment before the booking is secured.";
  }

  if (status === "paid_confirmed" && paymentStatus === "paid") {
    return "This booking is paid and confirmed. Inventory has been deducted.";
  }

  if (status === "declined") {
    return "This request has been declined.";
  }

  if (status === "contacted") {
    return "This lead is marked as contacted. You can now accept it for payment or decline it.";
  }

  return "Review this lead, message the traveler if needed, then accept for payment or decline.";
}

export default async function VendorLeadDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
      updated?: string;
      notes?: string;
      error?: string;
    }>;
  },
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

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

  const { data: messages } = await supabaseAdmin
    .from("booking_messages")
    .select("*")
    .eq("booking_request_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">Lead Detail</p>
            <h1 className="mt-2 text-4xl font-semibold">
              {lead.experiences?.title || "Booking lead"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/vendor" className="rounded-xl border px-5 py-3">
              Back to leads
            </Link>

            <Link
              href={`/messages/${lead.id}`}
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              Message traveler
            </Link>

            {lead.experiences?.slug ? (
              <Link
                href={`/experiences/${lead.experiences.slug}`}
                className="rounded-xl border px-5 py-3"
              >
                View public page
              </Link>
            ) : null}
          </div>
        </div>

        {searchParams.updated ? (
          <div className="mb-6 rounded-2xl bg-green-50 p-4 text-green-800">
            Lead updated: {prettyStatus(searchParams.updated)}
          </div>
        ) : null}

        {searchParams.notes === "saved" ? (
          <div className="mb-6 rounded-2xl bg-green-50 p-4 text-green-800">
            Vendor notes saved.
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700">
            {searchParams.error}
          </div>
        ) : null}

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">
            Current state
          </p>

          <p className="mt-2 text-lg font-semibold">
            {prettyStatus(lead.contact_status)}
          </p>

          <p className="mt-2 text-neutral-600">
            {actionMessage(lead.contact_status, lead.payment_status)}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Guest</h2>

            <div className="mt-5 space-y-3 text-neutral-700">
              <p>
                <strong>Name:</strong> {lead.guest_name}
              </p>

              <p>
                <strong>Email:</strong> {lead.guest_email}
              </p>

              <p>
                <strong>Guests:</strong> {lead.guests}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/messages/${lead.id}`}
                className="rounded-xl bg-black px-5 py-3 text-white"
              >
                Open conversation
              </Link>

              <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                <input type="hidden" name="contact_status" value="contacted" />
                <button className="rounded-xl border px-5 py-3">
                  Mark contacted
                </button>
              </form>
            </div>

            {lead.notes ? (
              <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm font-medium">Guest notes</p>
                <p className="mt-2 text-sm text-neutral-600">{lead.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Booking</h2>

            <div className="mt-5 space-y-3 text-neutral-700">
              <p>
                <strong>Status:</strong> {lead.status}
              </p>

              <p>
                <strong>Contact status:</strong>{" "}
                {prettyStatus(lead.contact_status)}
              </p>

              <p>
                <strong>Payment:</strong> {lead.payment_status}
              </p>

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

            <div className="mt-8 rounded-2xl bg-neutral-50 p-5">
              <p className="font-medium">Decision</p>

              <p className="mt-2 text-sm text-neutral-600">
                Accepting sends the traveler to payment. Inventory is only
                reduced after payment is completed.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                  <input
                    type="hidden"
                    name="contact_status"
                    value="confirmed_pending_payment"
                  />
                  <button className="rounded-xl bg-black px-5 py-3 text-white">
                    Accept & request payment
                  </button>
                </form>

                <form action={`/api/vendor/leads/${lead.id}/status`} method="post">
                  <input type="hidden" name="contact_status" value="declined" />
                  <button className="rounded-xl border px-5 py-3 text-red-600">
                    Decline request
                  </button>
                </form>
              </div>
            </div>

            <form
              action={`/api/vendor/leads/${lead.id}/notes`}
              method="post"
              className="mt-8"
            >
              <label className="mb-2 block text-sm font-medium">
                Vendor notes
              </label>

              <textarea
                name="vendor_notes"
                defaultValue={lead.vendor_notes || ""}
                rows={5}
                className="w-full rounded-2xl border px-4 py-3"
                placeholder="Internal notes about this lead..."
              />

              <button className="mt-3 rounded-xl border px-5 py-3">
                Save notes
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8">
          <MessageThread
            bookingId={lead.id}
            messages={
              (messages ?? []) as {
                id: string;
                sender_role: string;
                message: string;
                created_at: string;
              }[]
            }
            compact
          />
        </div>
      </section>
    </main>
  );
}