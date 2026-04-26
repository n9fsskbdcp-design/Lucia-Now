import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";
import {
  getBookingStatusLabel,
  getBookingStatusTone,
} from "@/lib/bookings/status";

function toneClass(tone: string) {
  if (tone === "amber") return "bg-amber-100 text-amber-800";
  if (tone === "green") return "bg-green-100 text-green-800";
  if (tone === "blue") return "bg-blue-100 text-blue-800";
  if (tone === "red") return "bg-red-100 text-red-800";
  return "bg-neutral-100 text-neutral-700";
}

function statusIcon(tone: string) {
  if (tone === "amber") return <CreditCard size={15} />;
  if (tone === "green") return <CheckCircle2 size={15} />;
  if (tone === "blue") return <AlertCircle size={15} />;
  if (tone === "red") return <XCircle size={15} />;
  return <Clock size={15} />;
}

export default function BookingStatusBadge({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  const tone = getBookingStatusTone({ contactStatus, paymentStatus });
  const label = getBookingStatusLabel({ contactStatus, paymentStatus });

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${toneClass(
        tone,
      )}`}
    >
      {statusIcon(tone)}
      {label}
    </span>
  );
}