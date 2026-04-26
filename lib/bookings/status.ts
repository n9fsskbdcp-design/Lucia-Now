export type BookingContactStatus =
  | "new"
  | "contacted"
  | "confirmed_pending_payment"
  | "paid_confirmed"
  | "declined"
  | "cancelled";

export type BookingPaymentStatus = "unpaid" | "paid" | "refunded";

export function getBookingStatusLabel({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  if (contactStatus === "new") return "Request sent";
  if (contactStatus === "contacted") return "Reviewed";
  if (contactStatus === "confirmed_pending_payment") return "Awaiting payment";

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "Paid & confirmed";
  }

  if (contactStatus === "declined") return "Declined";
  if (contactStatus === "cancelled") return "Cancelled";

  return "Request update";
}

export function getBookingStatusDescription({
  contactStatus,
  paymentStatus,
  viewer,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
  viewer: "tourist" | "vendor" | "admin";
}) {
  if (contactStatus === "new") {
    return viewer === "vendor"
      ? "Review this request, message the traveler if needed, then accept or decline."
      : "Your request was sent to the partner and is waiting for review.";
  }

  if (contactStatus === "contacted") {
    return viewer === "vendor"
      ? "You marked this request as contacted. You can still accept or decline it."
      : "The partner reviewed your request. Check messages for any follow-up.";
  }

  if (contactStatus === "confirmed_pending_payment") {
    return viewer === "vendor"
      ? "Accepted. The traveler needs to complete payment before the booking is secured."
      : "Your request was accepted. Complete payment to secure your booking.";
  }

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return viewer === "vendor"
      ? "Paid and confirmed. Inventory has been deducted."
      : "Your booking is paid and confirmed.";
  }

  if (contactStatus === "declined") {
    return viewer === "vendor"
      ? "This request has been declined."
      : "The partner declined this booking request.";
  }

  if (contactStatus === "cancelled") {
    return "This booking request has been cancelled.";
  }

  return "This booking request was updated.";
}

export function getBookingStatusTone({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  if (contactStatus === "confirmed_pending_payment") return "amber";

  if (contactStatus === "paid_confirmed" && paymentStatus === "paid") {
    return "green";
  }

  if (contactStatus === "contacted") return "blue";

  if (contactStatus === "declined" || contactStatus === "cancelled") {
    return "red";
  }

  return "neutral";
}

export function canTouristCancel({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  return (
    paymentStatus !== "paid" &&
    ["new", "contacted", "confirmed_pending_payment"].includes(
      contactStatus || "",
    )
  );
}

export function canVendorCancel({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  return (
    paymentStatus !== "paid" &&
    ["new", "contacted", "confirmed_pending_payment"].includes(
      contactStatus || "",
    )
  );
}

export function canVendorMarkContacted({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  return paymentStatus !== "paid" && contactStatus === "new";
}

export function canVendorAccept({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  return (
    paymentStatus !== "paid" && ["new", "contacted"].includes(contactStatus || "")
  );
}

export function canVendorDecline({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  return (
    paymentStatus !== "paid" &&
    ["new", "contacted", "confirmed_pending_payment"].includes(
      contactStatus || "",
    )
  );
}

export function isAwaitingPayment({
  contactStatus,
}: {
  contactStatus: string | null;
}) {
  return contactStatus === "confirmed_pending_payment";
}

export function isPaidConfirmed({
  contactStatus,
  paymentStatus,
}: {
  contactStatus: string | null;
  paymentStatus: string | null;
}) {
  return contactStatus === "paid_confirmed" && paymentStatus === "paid";
}

export function isClosedBooking({
  contactStatus,
}: {
  contactStatus: string | null;
}) {
  return ["declined", "cancelled"].includes(contactStatus || "");
}