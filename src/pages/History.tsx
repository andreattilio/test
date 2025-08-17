import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Trash2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";
import { EditEntryDialog } from "@/components/EditEntryDialog";

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

  const calculateDayTotals = (entries: any[]) => {
    let peeCount = 0;
    let pooCount = 0;
    let feedCount = 0;
    let totalFeedAmount = 0;
    let sleepCount = 0;
    let totalSleepMinutes = 0;

    entries.forEach(entry => {
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

  const groupByWeek = (history: any[]) => {
    const weeks: { [key: string]: any[] } = {};
    
    history.forEach(day => {
      const date = new Date(day.date);
      // Get Monday of the week
      const monday = new Date(date);
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      monday.setDate(diff);
      
      const weekKey = monday.toISOString().split('T')[0];
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(day);
    });

    return Object.entries(weeks).map(([weekStart, days]) => ({
      weekStart,
      days: days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })).sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const weeklyGroups = groupByWeek(history);

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
          {/* Nested tabs for Daily vs Weekly view */}
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
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

            <TabsContent value="weekly" className="space-y-6">
              {/* Show activities grouped by week */}
              {weeklyGroups.map((week) => (
                <div key={week.weekStart} className="space-y-3">
                  <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      Week of {formatWeekRange(week.weekStart)}
                    </h2>
                    <Separator className="mt-2" />
                  </div>
                  
                  {week.days.map((day) => (
                    <div key={day.date} className="ml-4 space-y-2">
                      <h3 className="text-lg font-medium text-foreground">
                        {formatDate(day.date)}
                      </h3>
                      {day.entries.map((entry) => (
                        <Card key={entry.id} className="p-4 ml-4">
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
                      ))}
                    </div>
                  ))}
                </div>
              ))}
              
              {weeklyGroups.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No weekly data yet
                  </h3>
                  <p className="text-muted-foreground">
                    Start logging activities to see weekly summaries
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="totals" className="space-y-6">
          <div className="text-center mb-6">
            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
            <h2 className="text-2xl font-semibold text-foreground">Daily Statistics</h2>
            <p className="text-muted-foreground">Activity counts for each day (00:00 - 23:59)</p>
          </div>

          <div className="space-y-4">
            {history.map((day) => {
              const dayTotals = calculateDayTotals(day.entries);
              return (
                <div key={day.date} className="space-y-3">
                  <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {formatDate(day.date)}
                    </h3>
                    <Separator className="mt-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 text-center">
                      <div className="text-2xl mb-1">💧</div>
                      <h4 className="text-sm font-medium text-foreground">Pee</h4>
                      <p className="text-lg font-bold text-primary">{dayTotals.peeCount}</p>
                    </Card>

                    <Card className="p-4 text-center">
                      <div className="text-2xl mb-1">💩</div>
                      <h4 className="text-sm font-medium text-foreground">Poo</h4>
                      <p className="text-lg font-bold text-primary">{dayTotals.pooCount}</p>
                    </Card>

                    <Card className="p-4 text-center">
                      <div className="text-2xl mb-1">🍼</div>
                      <h4 className="text-sm font-medium text-foreground">Feeds</h4>
                      <p className="text-lg font-bold text-primary">{dayTotals.feedCount}</p>
                      {dayTotals.totalFeedAmount > 0 && (
                        <p className="text-xs text-muted-foreground">{dayTotals.totalFeedAmount}ml</p>
                      )}
                    </Card>

                    <Card className="p-4 text-center">
                      <div className="text-2xl mb-1">😴</div>
                      <h4 className="text-sm font-medium text-foreground">Sleep</h4>
                      <p className="text-lg font-bold text-primary">{dayTotals.sleepCount}</p>
                      <p className="text-xs text-muted-foreground">{dayTotals.totalSleepFormatted}</p>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>

          {history.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No data to display
              </h3>
              <p className="text-muted-foreground">
                Start logging activities to see daily statistics
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;