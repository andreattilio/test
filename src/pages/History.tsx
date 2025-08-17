import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";

const History = () => {
  const { toast } = useToast();
  const { history, deleteActivity } = useActivity();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const getEntryDescription = (entry: any) => {
    switch (entry.type) {
      case "feed":
        return `${entry.subtype === "formula" ? "Formula" : "Breast milk"} - ${entry.amount}ml`;
      case "diaper":
        return entry.subtype === "pee" ? "Pee" : "Poo";
      case "sleep":
        if (entry.subtype === "session") {
          return `Sleep: ${entry.sleepStart} - ${entry.sleepEnd} (${entry.sleepDuration})`;
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

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Activity History
        </h1>
        <p className="text-muted-foreground mt-2">All recorded activities</p>
      </div>

      {/* History List */}
      <div className="space-y-6">
        {history.map((day) => (
          <div key={day.date} className="space-y-3">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2">
              <h2 className="text-xl font-semibold text-foreground">
                {formatDate(day.date)}
              </h2>
              <Separator className="mt-2" />
            </div>
            
            <div className="space-y-2">
              {day.entries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{entry.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {getEntryDescription(entry)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.time}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state for when no data */}
      {history.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No activities yet
          </h3>
          <p className="text-muted-foreground">
            Start logging activities to see them here
          </p>
        </div>
      )}
    </div>
  );
};

export default History;