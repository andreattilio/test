import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";

const History = () => {
  // Mock data - will be replaced with real data from database
  const mockHistory = [
    {
      date: "2024-01-17",
      entries: [
        { time: "14:30", type: "feed", subtype: "formula", amount: 120, icon: "🍼" },
        { time: "13:45", type: "diaper", subtype: "pee", icon: "💧" },
        { time: "12:15", type: "sleep", subtype: "end", icon: "🌅" },
        { time: "10:30", type: "sleep", subtype: "start", icon: "😴" },
        { time: "09:15", type: "feed", subtype: "breast", amount: 80, icon: "🤱" },
      ]
    },
    {
      date: "2024-01-16",
      entries: [
        { time: "22:30", type: "feed", subtype: "formula", amount: 150, icon: "🍼" },
        { time: "21:45", type: "diaper", subtype: "poo", icon: "💩" },
        { time: "20:15", type: "diaper", subtype: "pee", icon: "💧" },
        { time: "19:30", type: "feed", subtype: "breast", amount: 90, icon: "🤱" },
        { time: "18:00", type: "sleep", subtype: "end", icon: "🌅" },
        { time: "16:30", type: "sleep", subtype: "start", icon: "😴" },
      ]
    }
  ];

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
        day: 'numeric' 
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
        return entry.subtype === "start" ? "Sleep started" : "Sleep ended";
      default:
        return "";
    }
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
        {mockHistory.map((day) => (
          <div key={day.date} className="space-y-3">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2">
              <h2 className="text-xl font-semibold text-foreground">
                {formatDate(day.date)}
              </h2>
              <Separator className="mt-2" />
            </div>
            
            <div className="space-y-2">
              {day.entries.map((entry, index) => (
                <Card key={index} className="p-4">
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
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state for when no data */}
      {mockHistory.length === 0 && (
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