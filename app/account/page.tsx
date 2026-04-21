import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-neutral-500">Account</p>

        <h1 className="mt-3 text-4xl font-semibold">Welcome back</h1>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Profile</h2>

            <div className="mt-5 space-y-3 text-sm text-neutral-600">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {profile?.full_name || "—"}</p>
              <p><strong>Role:</strong> {profile?.role || "tourist"}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Quick actions</h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/experiences"
                className="rounded-xl bg-black px-5 py-3 text-white"
              >
                Book something new
              </Link>

              <Link
                href="/partners"
                className="rounded-xl border px-5 py-3"
              >
                Become a partner
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Your booking requests</h2>

          {!requests || requests.length === 0 ? (
            <p className="mt-6 text-neutral-500">
              You haven’t sent any booking requests yet.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl bg-neutral-50 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {request.experiences?.title || "Experience"}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-500">
                        Guests: {request.guests}
                      </p>

                      {request.requested_start_at ? (
                        <p className="mt-1 text-sm text-neutral-500">
                          Requested slot:{" "}
                          {new Date(request.requested_start_at).toLocaleString()}
                        </p>
                      ) : null}

                      {request.notes ? (
                        <p className="mt-3 text-sm text-neutral-700">
                          {request.notes}
                        </p>
                      ) : null}

                      {request.experiences?.slug ? (
                        <Link
                          href={`/experiences/${request.experiences.slug}`}
                          className="mt-4 inline-block text-sm font-medium underline"
                        >
                          View experience
                        </Link>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <StatusBadge label={request.status} />
                      <StatusBadge label={request.contact_status} subtle />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({
  label,
  subtle = false,
}: {
  label: string;
  subtle?: boolean;
}) {
  const base = subtle
    ? "bg-neutral-100 text-neutral-700"
    : label === "new"
      ? "bg-blue-100 text-blue-800"
      : label === "confirmed"
        ? "bg-green-100 text-green-800"
        : label === "declined"
          ? "bg-red-100 text-red-800"
          : "bg-neutral-100 text-neutral-700";

  return (
    <div className={`rounded-full px-3 py-1 text-xs font-medium ${base}`}>
      {label}
    </div>
  );
}