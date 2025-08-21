import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";
import { EditEntryDialog } from "@/components/EditEntryDialog";

// --- helpers: local date key <-> Date ---
const parseLocalKey = (key: string) => {
  // key is "YYYY-MM-DD" and should be treated as LOCAL midnight
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const History = () => {
  const { toast } = useToast();
  const { history, deleteActivity } = useActivity();

  const formatDate = (dateKey: string) => {
    const d = parseLocalKey(dateKey);
    const today = new Date();
    const yday = new Date();
    yday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yday.toDateString()) return "Yesterday";

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeToAMPM = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const h12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const getEntryTitle = (entry: any) => {
    switch (entry.type) {
      case "feed":
        return `${entry.subtype === "formula" ? "Formula" : "Breast milk"} - ${entry.amount}ml`;
      case "diaper":
        return entry.subtype === "pee" ? "Pee" : "Poo";
      case "sleep":
        if (entry.subtype === "session") {
          return `Sleep: ${formatTimeToAMPM(entry.sleepStart)} - ${formatTimeToAMPM(entry.sleepEnd)}`;
        }
        return entry.subtype === "start" ? "Sleep started" : "Sleep ended";
      default:
        return "";
    }
  };

  const deleteEntry = (entryId: string) => {
    deleteActivity(entryId);
    toast({
      title: "Entry deleted",
      description: "Activity has been removed from history",
      duration: 2000,
    });
  };

  const groupByWeek = (days: any[]) => {
    const weeks: Record<string, any[]> = {};
    for (const day of days) {
      const date = parseLocalKey(day.date);
      // Monday of that local week
      const monday = new Date(date);
      const dow = date.getDay();
      const diff = date.getDate() - dow + (dow === 0 ? -6 : 1);
      monday.setDate(diff);
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(
        monday.getDate()
      ).padStart(2, "0")}`;
      (weeks[key] ||= []).push(day);
    }
    return Object.entries(weeks)
      .map(([weekStart, ds]) => ({
        weekStart,
        days: ds.sort(
          (a, b) => parseLocalKey(b.date).getTime() - parseLocalKey(a.date).getTime()
        ),
      }))
      .sort((a, b) => parseLocalKey(b.weekStart).getTime() - parseLocalKey(a.weekStart).getTime());
  };

  const weeklyGroups = groupByWeek(history);

  const renderDay = (day: any) => (
    <div key={day.date} className="space-y-3">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2">
        <h2 className="text-xl font-semibold text-foreground">{formatDate(day.date)}</h2>
        <Separator className="mt-2" />
      </div>

      <div className="space-y-2">
        {day.entries.map((entry: any) => {
          const isSleepSession = entry.type === "sleep" && entry.subtype === "session";
          return (
            <Card key={entry.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{entry.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{getEntryTitle(entry)}</p>
                  <p className="text-sm text-muted-foreground">
                    {isSleepSession ? entry.sleepDuration : formatTimeToAMPM(entry.time)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <EditEntryDialog entry={entry} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEntry(entry.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Activity History
        </h1>
        <p className="text-muted-foreground mt-2">All recorded activities and statistics</p>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="all">All Days</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-6">
          {history.slice(0, 1).map(renderDay)}
          {(history.length === 0 || history[0]?.entries.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No activities today</h3>
              <p className="text-muted-foreground">Start logging activities to see them here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {history.map(renderDay)}
          {history.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No activities yet</h3>
              <p className="text-muted-foreground">Start logging activities to see them here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
