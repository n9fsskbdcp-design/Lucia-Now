"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarkNotificationsReadRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          cache: "no-store",
        });

        window.dispatchEvent(new Event("lucia-now:sync-badges"));
        router.refresh();
      } catch {
        // Keep page stable if read sync fails.
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return null;
}