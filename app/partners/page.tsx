import PartnerApplicationForm from "@/components/vendor/partner-application-form";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const submitted = params.submitted === "1";

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Lucia Now Partners
        </p>

        <h1 className="mt-4 text-5xl font-semibold">
          Become a Partner
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-neutral-600">
          Join Lucia Now to receive high-intent travelers looking for premium
          St Lucia experiences.
        </p>

        {submitted ? (
          <div className="mt-10 rounded-2xl bg-green-50 p-6 text-green-800">
            Your application has been submitted. We’ll review it and follow up.
          </div>
        ) : null}

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <PartnerApplicationForm />
        </div>
      </section>
    </main>
  );
}