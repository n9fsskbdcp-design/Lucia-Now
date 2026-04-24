import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Compass, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function prettyStatus(contactStatus: string, paymentStatus: string) {
  if (contactStatus === "confirmed_pending_payment") return "Awaiting payment";
  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") return "Paid & confirmed";
  if (contactStatus === "contacted") return "Contacted";
  return contactStatus;
}

function statusClass(label: string) {
  if (label === "Awaiting payment") return "bg-amber-100 text-amber-800";
  if (label === "Paid & confirmed") return "bg-green-100 text-green-800";
  if (label === "declined") return "bg-red-100 text-red-800";
  return "bg-neutral-100 text-neutral-700";
}

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabaseAdmin
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = requests ?? [];
  const awaitingPayment = bookings.filter(
    (item) => item.contact_status === "confirmed_pending_payment",
  ).length;

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-sm text-neutral-500">Traveler account</p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-2 text-neutral-600">
                Manage booking requests, payments, and messages.
              </p>
            </div>

            <Link
              href="/experiences"
              className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-3 font-medium text-white"
            >
              <Compass className="mr-2" size={18} />
              Browse experiences
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <User className="text-neutral-500" size={20} />
            <p className="mt-4 text-sm text-neutral-500">Signed in as</p>
            <p className="mt-1 truncate font-medium">{user.email}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <CalendarDays className="text-neutral-500" size={20} />
            <p className="mt-4 text-sm text-neutral-500">Requests</p>
            <p className="mt-1 text-3xl font-semibold">{bookings.length}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <CalendarDays className="text-neutral-500" size={20} />
            <p className="mt-4 text-sm text-neutral-500">Awaiting payment</p>
            <p className="mt-1 text-3xl font-semibold">{awaitingPayment}</p>
          </div>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-neutral-500">Bookings</p>
              <h2 className="mt-1 text-2xl font-semibold">Your requests</h2>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-neutral-50 p-8 text-center">
              <p className="font-medium">No booking requests yet</p>
              <p className="mt-2 text-sm text-neutral-500">
                Start by browsing experiences and requesting a date.
              </p>
              <Link
                href="/experiences"
                className="mt-5 inline-flex rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
              >
                Explore experiences
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {bookings.map((request) => {
                const label = prettyStatus(request.contact_status, request.payment_status);

                return (
                  <Link
                    key={request.id}
                    href={`/account/bookings/${request.id}`}
                    className="block rounded-3xl bg-neutral-50 p-4 transition hover:bg-neutral-100 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {request.experiences?.title || "Experience"}
                        </h3>

                        <p className="mt-2 text-sm text-neutral-500">
                          {request.guests} guest{request.guests === 1 ? "" : "s"}
                        </p>

                        {request.requested_start_at ? (
                          <p className="mt-1 text-sm text-neutral-500">
                            {new Date(request.requested_start_at).toLocaleString()}
                          </p>
                        ) : null}
                      </div>

                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(label)}`}>
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}