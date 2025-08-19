import { supabase } from "@/lib/supabase";

export async function fetchEntries() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("account_id", uid)
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data ?? [];
}