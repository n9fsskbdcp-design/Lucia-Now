import NavbarClient from "./navbar-client";
import { createClient } from "@/lib/supabase/server";
import { getUnreadMessageCount } from "@/lib/messages/unread";
import { getUnreadAppNotificationCount } from "@/lib/notifications/unread";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "guest";
  let unreadMessages = 0;
  let unreadNotifications = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role || "tourist";

    unreadMessages = await getUnreadMessageCount({
      userId: user.id,
      role,
    });

    unreadNotifications = await getUnreadAppNotificationCount({
      userId: user.id,
      role,
    });
  }

  return (
    <NavbarClient
      initialUser={!!user}
      initialRole={role}
      initialUnreadMessages={unreadMessages}
      initialUnreadNotifications={unreadNotifications}
    />
  );
}