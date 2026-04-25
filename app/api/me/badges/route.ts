import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnreadMessageCount } from "@/lib/messages/unread";
import { getUnreadAppNotificationCount } from "@/lib/notifications/unread";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      role: "guest",
      unreadMessages: 0,
      unreadNotifications: 0,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "tourist";

  const unreadMessages = await getUnreadMessageCount({
    userId: user.id,
    role,
  });

  const unreadNotifications = await getUnreadAppNotificationCount({
    userId: user.id,
    role,
  });

  return NextResponse.json({
    authenticated: true,
    role,
    unreadMessages,
    unreadNotifications,
  });
}