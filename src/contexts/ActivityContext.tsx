// src/contexts/ActivityContext.tsx
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fetchEntries } from "@/api/entries";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { saveFromActivity } from "@/api/saveFromActivity";
import { deleteEntryById } from "@/api/deleteEntry";
import { updateEntryById } from "@/api/updateEntry";

//addition 1
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;


export interface ActivityEntry {
  id: string;
  time: string;
  type: "feed" | "diaper" | "sleep";
  subtype: string;
  amount?: number;
  icon: string;
  timestamp: Date;
  sleepStart?: string;
  sleepEnd?: string;
  sleepDuration?: string;
}

export interface DayHistory {
  date: string;
  entries: ActivityEntry[];
}

interface ActivityContextType {
  history: DayHistory[];
  addActivity: (activity: Omit<ActivityEntry, "id" | "timestamp">) => void;
  deleteActivity: (entryId: string) => void;
  editActivity: (updatedEntry: ActivityEntry) => void;
  sleepStartTime: Date | null;
  setSleepStartTime: (time: Date | null) => void;
  completeSleepSession: (endAt?: Date) => void; // ← accept edited end time
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sleepStartTime, setSleepStartTime] = useState<Date | null>(null);
  const [pendingSleepId, setPendingSleepId] = useState<string | null>(null);

  const [history, setHistory] = useState<DayHistory[]>(() => {
    const today = new Date();
    return [
      {//addition 2
        date: dayKey(today),
        entries: [
          {
            id: "1",
            time: "14:30",
            type: "feed",
            subtype: "formula",
            amount: 120,
            icon: "🍼",
            timestamp: new Date(),
          },
          {
            id: "2",
            time: "13:45",
            type: "diaper",
            subtype: "pee",
            icon: "💧",
            timestamp: new Date(),
          },
        ],
      },
    ];
  });

  const SLEEP_KEY = "sleepInProgress";

  // Map a DB row → your local entry shape
  function rowToLocal(row: any): ActivityEntry {
    const dt = new Date(row.started_at);
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");

    const base: any = {
      id: row.id,
      time: `${hh}:${mm}`,
      timestamp: dt,
      icon: "📝",
      type: "feed",
      subtype: "",
    };

    switch (row.event) {
      case "feed_formula":
        base.type = "feed"; base.subtype = "formula"; base.amount = row.value ?? undefined; base.icon = "🍼"; break;
      case "feed_breast":
        base.type = "feed"; base.subtype = "breast"; base.amount = row.value ?? undefined; base.icon = "👩🏻‍🍼"; break;
      case "pee":
        base.type = "diaper"; base.subtype = "pee"; base.icon = "💧"; break;
      case "poop":
        base.type = "diaper"; base.subtype = "poo"; base.icon = "💩"; break;
      case "sleep":
        base.type = "sleep"; base.subtype = "session"; base.icon = "😴";
        if (row.duration_min != null) {
          const end = new Date(dt.getTime() + row.duration_min * 60000);
          base.sleepStart = `${hh}:${mm}`;
          base.sleepEnd = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
          const h = Math.floor(row.duration_min / 60), m = row.duration_min % 60;
          base.sleepDuration = `${h}h ${m}m`;
        }
        break;
      case "wake":
        base.type = "sleep"; base.subtype = "end"; base.icon = "😴"; break;
    }
    return base as ActivityEntry;
  }

  // 🔁 Load cloud rows and replace local history
  async function syncFromCloud() {
    try {
      const rows = await fetchEntries();
      const byDate: Record<string, ActivityEntry[]> = {};
      for (const r of rows) {
        const local = rowToLocal(r);
        const key = dayKey(local.timestamp); // YYYY-MM-DD
        (byDate[key] ||= []).push(local);
      }
      const days: DayHistory[] = Object.entries(byDate)
        .map(([date, entries]) => ({
          date,
          entries: entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(days);
    } catch (e) {
      console.warn("syncFromCloud failed", e);
    }
  }

  // ▶️ On mount: sync data AND resume any open sleep row from Supabase
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      await syncFromCloud();

      // find most recent open sleep row (duration_min IS NULL)
      const { data: open, error } = await supabase
        .from("entries")
        .select("id, started_at")
        .eq("event", "sleep")
        .is("duration_min", null)
        .order("started_at", { ascending: false })
        .limit(1);

      if (!error && open && open.length) {
        const row = open[0];
        setSleepStartTime(new Date(row.started_at));
        setPendingSleepId(row.id);
        localStorage.setItem(
          SLEEP_KEY,
          JSON.stringify({ startedAt: row.started_at, cloudId: row.id })
        );
      }
    })();
  }, []);

  const addActivity = (activity: Omit<ActivityEntry, "id" | "timestamp">) => {
    const now = new Date();
    const today = dayKey(now);

    const timeString =
      activity.time ||
      now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

    let timestamp = now;
    if (activity.time) {
      const [hours, minutes] = activity.time.split(":").map(Number);
      timestamp = new Date();
      timestamp.setHours(hours, minutes, 0, 0);
    }

    const newEntry: ActivityEntry = {
      ...activity,
      id: Date.now().toString(), // temp id (only used if not sleep-start)
      time: timeString,
      timestamp,
    };

    // 🌙 Sleep start: create a cloud row immediately (duration_min = null)
    if (activity.type === "sleep" && activity.subtype === "start") {
      saveFromActivity({ ...newEntry, subtype: "start" })
        .then((cloudId: any) => {
          // saveFromActivity returns the inserted id
          const id = typeof cloudId === "string" ? cloudId : cloudId?.id || cloudId;
          setSleepStartTime(timestamp);
          setPendingSleepId(id);
          localStorage.setItem(
            SLEEP_KEY,
            JSON.stringify({ startedAt: timestamp.toISOString(), cloudId: id })
          );
        })
        .catch((e) => console.error("Cloud start sleep failed:", e?.message ?? e));
      return; // don't add to local history yet
    }

    // normal (feed/diaper): add locally
    setHistory((prev) => {
      const existingDayIndex = prev.findIndex((day) => day.date === today);
      if (existingDayIndex >= 0) {
        const updated = [...prev];
        updated[existingDayIndex] = {
          ...updated[existingDayIndex],
          entries: [newEntry, ...updated[existingDayIndex].entries],
        };
        return updated;
      }
      return [{ date: today, entries: [newEntry] }, ...prev];
    });

    // Save to Supabase and refresh so ids match DB
    saveFromActivity(newEntry)
      .then(() => syncFromCloud())
      .catch((e) => console.error("Cloud save failed:", e?.message ?? e));
  };

  const completeSleepSession = (endAt?: Date) => {
    if (!sleepStartTime || !pendingSleepId) return;

    const end = endAt ?? new Date(); // ← use edited end time when provided
    const today = dayKey(end);
    const duration = Math.floor((end.getTime() - sleepStartTime.getTime()) / (1000 * 60));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    // local display entry
    const sleepEntry: ActivityEntry = {
      id: pendingSleepId,                // use cloud id
      type: "sleep",
      subtype: "session",
      icon: "😴",
      time: sleepStartTime.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      timestamp: sleepStartTime,
      sleepStart: sleepStartTime.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      sleepEnd: end.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      sleepDuration: `${hours}h ${minutes}m`,
    };

    // add to local history
    setHistory((prev) => {
      const existingDayIndex = prev.findIndex((day) => day.date === today);
      if (existingDayIndex >= 0) {
        const updated = [...prev];
        updated[existingDayIndex] = {
          ...updated[existingDayIndex],
          entries: [sleepEntry, ...updated[existingDayIndex].entries],
        };
        return updated;
      }
      return [{ date: today, entries: [sleepEntry] }, ...prev];
    });

    // clear local "in progress"
    setPendingSleepId(null);
    setSleepStartTime(null);
    localStorage.removeItem(SLEEP_KEY);

    // ☑️ update the existing cloud row with duration
    updateEntryById(sleepEntry.id, sleepEntry)
      .then(() => syncFromCloud())
      .catch((e) => console.error("Cloud finish sleep failed:", e?.message ?? e));
  };

  const deleteActivity = (entryId: string) => {
    // cloud delete (best effort)
    deleteEntryById(entryId).catch((e) => console.warn("Cloud delete failed:", e?.message ?? e));

    // local remove
    setHistory((prev) =>
      prev
        .map((day) => ({
          ...day,
          entries: day.entries.filter((entry) => entry.id !== entryId),
        }))
        .filter((day) => day.entries.length > 0)
    );
  };

  function applyTimeToTimestamp(entry: ActivityEntry): ActivityEntry {
    if (!entry.time) return entry;
    const [hh, mm] = entry.time.split(":").map(Number);
    const dt = new Date(entry.timestamp);
    dt.setHours(hh ?? 0, mm ?? 0, 0, 0);
    return { ...entry, timestamp: dt };
  }

  const editActivity = (updatedEntry: ActivityEntry) => {
    const fixed = applyTimeToTimestamp(updatedEntry);

    // local update
    setHistory((prev) =>
      prev.map((day) => ({
        ...day,
        entries: day.entries.map((entry) => (entry.id === fixed.id ? fixed : entry)),
      }))
    );

    // cloud update
    updateEntryById(fixed.id, fixed)
      .then(() => console.log("Cloud update OK"))
      .catch((e) => console.error("Cloud update failed:", e?.message ?? e));
  };

  return (
    <ActivityContext.Provider
      value={{
        history,
        addActivity,
        deleteActivity,
        editActivity,
        sleepStartTime,
        setSleepStartTime,
        completeSleepSession,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
