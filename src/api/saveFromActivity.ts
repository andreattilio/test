// src/api/saveFromActivity.ts
import { supabase } from "@/lib/supabase";
import type { ActivityEntry } from "@/contexts/ActivityContext";

export async function saveFromActivity(entry: Partial<ActivityEntry>): Promise<string> {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!auth.user) throw new Error("Not signed in");

  // started_at should reflect the chosen time
  const started_at = entry.timestamp instanceof Date
    ? entry.timestamp.toISOString()
    : new Date().toISOString();

  let event = "";
  let value: number | null = null;
  let unit: string | null = null;
  let duration_min: number | null = null;

  switch (entry.type) {
    case "feed":
      event = entry.subtype === "formula" ? "feed_formula" : "feed_breast";
      if (typeof entry.amount === "number") {
        value = entry.amount;
        unit = "ml";
      }
      break;

    case "diaper":
      event = entry.subtype === "pee" ? "pee" : "poop";
      break;

    case "sleep":
      // Sleep START inserts with null duration; if a finished session is passed,
      // compute minutes from sleepDuration and store it.
      event = "sleep";
      if (entry.sleepDuration) {
        const m = entry.sleepDuration.match(/(\d+)h\s*(\d+)m/);
        if (m) duration_min = (+m[1]) * 60 + (+m[2]);
      } else {
        duration_min = null;
      }
      break;

    default:
      throw new Error("Unknown entry type");
  }

  const payload = {
    account_id: auth.user.id,
    event,
    value,
    unit,
    started_at,
    duration_min,
    notes: null as string | null,
  };

  const { data, error } = await supabase
    .from("entries")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}
