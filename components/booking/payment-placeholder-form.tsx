"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PaymentPlaceholderForm({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);

    const res = await fetch(`/api/bookings/${bookingId}/pay`, {
      method: "POST",
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not complete payment");
      return;
    }

    toast.success("Payment recorded");
    router.push(`/account/bookings/${bookingId}`);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-xl bg-black py-4 text-white disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay now"}
      </button>
    </div>
  );
}