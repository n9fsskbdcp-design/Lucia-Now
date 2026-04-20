import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getVendorByOwnerUserId(userId: string) {
  const { data } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .eq("owner_user_id", userId)
    .single();

  return data;
}

export async function getVendorExperiences(vendorId: string) {
  const { data } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  return data || [];
}