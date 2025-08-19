import { supabase } from "@/lib/supabase";

export async function deleteEntryById(id: string) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}
