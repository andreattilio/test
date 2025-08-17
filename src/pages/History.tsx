import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Trash2, BarChart3 } from "lucide-react";
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

  const calculateTotals = () => {
    let peeCount = 0;
    let pooCount = 0;
    let feedCount = 0;
    let totalFeedAmount = 0;
    let sleepCount = 0;
    let totalSleepMinutes = 0;

    history.forEach(day => {
      day.entries.forEach(entry => {
        switch (entry.type) {
          case "diaper":
            if (entry.subtype === "pee") peeCount++;
            if (entry.subtype === "poo") pooCount++;
            break;
          case "feed":
            feedCount++;
            if (entry.amount) totalFeedAmount += entry.amount;
            break;
          case "sleep":
            if (entry.subtype === "session" && entry.sleepDuration) {
              sleepCount++;
              // Parse duration like "2h 30m" to minutes
              const durationMatch = entry.sleepDuration.match(/(\d+)h\s*(\d+)m/);
              if (durationMatch) {
                const hours = parseInt(durationMatch[1]);
                const minutes = parseInt(durationMatch[2]);
                totalSleepMinutes += (hours * 60) + minutes;
              }
            }
            break;
        }
      });
    });

    const totalSleepHours = Math.floor(totalSleepMinutes / 60);
    const remainingSleepMinutes = totalSleepMinutes % 60;

    return {
      peeCount,
      pooCount,
      feedCount,
      totalFeedAmount,
      sleepCount,
      totalSleepFormatted: `${totalSleepHours}h ${remainingSleepMinutes}m`
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Activity History
        </h1>
        <p className="text-muted-foreground mt-2">All recorded activities and statistics</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="all">All Days</TabsTrigger>
          <TabsTrigger value="totals">Totals</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-6">
          {/* Show only today's entries */}
          {history.slice(0, 1).map((day) => (
            <div key={day.date} className="space-y-3">
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
          
          {(history.length === 0 || history[0]?.entries.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No activities today
              </h3>
              <p className="text-muted-foreground">
                Start logging activities to see them here
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {/* Show all days */}
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
        </TabsContent>

        <TabsContent value="totals" className="space-y-6">
          <div className="text-center mb-6">
            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
            <h2 className="text-2xl font-semibold text-foreground">Statistics Overview</h2>
            <p className="text-muted-foreground">Total counts across all recorded days</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <div className="text-3xl mb-2">💧</div>
              <h3 className="text-lg font-semibold text-foreground">Pee</h3>
              <p className="text-2xl font-bold text-primary">{totals.peeCount}</p>
              <p className="text-sm text-muted-foreground">diapers</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl mb-2">💩</div>
              <h3 className="text-lg font-semibold text-foreground">Poo</h3>
              <p className="text-2xl font-bold text-primary">{totals.pooCount}</p>
              <p className="text-sm text-muted-foreground">diapers</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl mb-2">🍼</div>
              <h3 className="text-lg font-semibold text-foreground">Feeds</h3>
              <p className="text-2xl font-bold text-primary">{totals.feedCount}</p>
              <p className="text-sm text-muted-foreground">sessions</p>
              {totals.totalFeedAmount > 0 && (
                <p className="text-lg font-semibold text-foreground mt-1">
                  {totals.totalFeedAmount}ml total
                </p>
              )}
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl mb-2">😴</div>
              <h3 className="text-lg font-semibold text-foreground">Sleep</h3>
              <p className="text-2xl font-bold text-primary">{totals.sleepCount}</p>
              <p className="text-sm text-muted-foreground">sessions</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {totals.totalSleepFormatted} total
              </p>
            </Card>
          </div>

          {history.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No data to display
              </h3>
              <p className="text-muted-foreground">
                Start logging activities to see statistics
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;