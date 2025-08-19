// src/api/updateEntry.ts
import { supabase } from "@/lib/supabase";
import type { ActivityEntry } from "@/contexts/ActivityContext";

export async function updateEntryById(id: string, entry: Partial<ActivityEntry>): Promise<void> {
  const patch: any = {};

  // If time was edited, update started_at to that timestamp
  if (entry.timestamp instanceof Date) {
    patch.started_at = entry.timestamp.toISOString();
  }

  if (entry.type === "feed") {
    patch.event = entry.subtype === "formula" ? "feed_formula" : "feed_breast";
    patch.value = typeof entry.amount === "number" ? entry.amount : null;
    patch.unit = typeof entry.amount === "number" ? "ml" : null;
    // make sure it's not a sleep record
    patch.duration_min = null;
  } else if (entry.type === "diaper") {
    patch.event = entry.subtype === "pee" ? "pee" : "poop";
    patch.value = null;
    patch.unit = null;
    patch.duration_min = null;
  } else if (entry.type === "sleep") {
    patch.event = "sleep";
    // compute minutes from "Xh Ym"
    if (entry.sleepDuration) {
      const m = entry.sleepDuration.match(/(\d+)h\s*(\d+)m/);
      if (m) patch.duration_min = (+m[1]) * 60 + (+m[2]);
    }
  }

  const { error } = await supabase.from("entries").update(patch).eq("id", id);
  if (error) throw error;
}
