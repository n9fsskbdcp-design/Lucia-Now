import { CheckCircle2 } from "lucide-react";
import { isClosedBooking, isPaidConfirmed } from "@/lib/bookings/status";

export default function BookingProgress({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  if (isClosedBooking({ contactStatus })) {
    return (
      <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">
        This booking request is no longer active.
      </div>
    );
  }

  const steps = [
    {
      label: "Request sent",
      active: true,
    },
    {
      label: "Partner reviewed",
      active: ["contacted", "confirmed_pending_payment", "paid_confirmed"].includes(
        contactStatus || "",
      ),
    },
    {
      label: "Payment needed",
      active: ["confirmed_pending_payment", "paid_confirmed"].includes(
        contactStatus || "",
      ),
    },
    {
      label: "Confirmed",
      active: isPaidConfirmed({ contactStatus, paymentStatus }),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {steps.map((step) => (
        <div
          key={step.label}
          className={`rounded-3xl p-4 ${
            step.active ? "bg-green-50 text-green-800" : "bg-neutral-50 text-neutral-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {step.active ? <CheckCircle2 size={16} /> : null}
            <p className="text-sm font-semibold">{step.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}