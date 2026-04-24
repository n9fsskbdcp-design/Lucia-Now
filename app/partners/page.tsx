import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";
import PartnerApplicationForm from "@/components/vendor/partner-application-form";

export default function PartnersPage() {
  return (
    <main className="page-shell">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1fr_520px]">
        <div className="rounded-[2rem] bg-neutral-950 p-8 text-white shadow-xl sm:p-10">
          <BriefcaseBusiness size={30} className="text-white/70" />

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
            Partner with Lucia Now
          </p>

          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
            List trusted experiences in Saint Lucia.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
            Apply to become a partner, manage availability, receive booking
            requests, and communicate with travelers inside the platform.
          </p>

          <div className="mt-8 grid gap-3">
            <Benefit icon={<ShieldCheck size={18} />} text="Verified partner profile" />
            <Benefit icon={<CheckCircle2 size={18} />} text="Booking leads and in-app messaging" />
            <Benefit icon={<CheckCircle2 size={18} />} text="Flexible scheduling and blackout dates" />
          </div>

          <div className="mt-8 rounded-3xl bg-white/10 p-5 text-sm leading-6 text-white/70 ring-1 ring-white/10">
            Already approved?{" "}
            <Link href="/auth/login" className="font-semibold text-white">
              Login to your partner workspace
            </Link>
            .
          </div>
        </div>

        <div className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-sm text-neutral-500">Application</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Tell us about your business
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Submit your details. Admin approval controls verification and live
            marketplace access.
          </p>

          <PartnerApplicationForm />
        </div>
      </section>
    </main>
  );
}

function Benefit({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 text-sm text-white/80 ring-1 ring-white/10">
      <div className="text-white/70">{icon}</div>
      <p>{text}</p>
    </div>
  );
}