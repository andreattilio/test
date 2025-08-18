import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Baby, Milk, Moon, RotateCcw, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";
import { SleepStartTimeEditor } from "@/components/SleepStartTimeEditor";
import { SleepEndTimeEditor } from "@/components/SleepEndTimeEditor";
import { TimeEditor } from "@/components/TimeEditor";

const Dashboard = () => {
  const { toast } = useToast();
  const { history, addActivity, sleepStartTime, setSleepStartTime, completeSleepSession } = useActivity();
  const [feedAmount, setFeedAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFeedType, setCurrentFeedType] = useState<"formula" | "breast">("formula");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSleepStartEditor, setShowSleepStartEditor] = useState(false);
  const [showSleepEndEditor, setShowSleepEndEditor] = useState(false);
  const [pendingStartTime, setPendingStartTime] = useState<Date | null>(null);
  const [pendingEndTime, setPendingEndTime] = useState<Date | null>(null);
  const [showFeedTimeEditor, setShowFeedTimeEditor] = useState(false);
  const [showDiaperTimeEditor, setShowDiaperTimeEditor] = useState(false);
  const [pendingFeedTime, setPendingFeedTime] = useState<Date | null>(null);
  const [pendingDiaperTime, setPendingDiaperTime] = useState<Date | null>(null);
  const [pendingFeedType, setPendingFeedType] = useState<"formula" | "breast">("formula");
  const [pendingDiaperType, setPendingDiaperType] = useState<"pee" | "poo">("pee");
  const [pendingFeedAmount, setPendingFeedAmount] = useState<number>(0);

  // Timer effect for sleep tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sleepStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - sleepStartTime.getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepStartTime]);

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = history.find(day => day.date === today)?.entries || [];
    
    const feedTotal = todayEntries
      .filter(entry => entry.type === 'feed')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const peeCount = todayEntries.filter(entry => 
      entry.type === 'diaper' && entry.subtype.includes('pee')).length;
    
    const pooCount = todayEntries.filter(entry => 
      entry.type === 'diaper' && entry.subtype.includes('poo')).length;
    
    const sleepEntries = todayEntries.filter(entry => entry.type === 'sleep' && entry.subtype === 'session');
    const totalSleepMinutes = sleepEntries.reduce((total, entry) => {
      if (entry.sleepStart && entry.sleepEnd) {
        const [startHour, startMin] = entry.sleepStart.split(':').map(Number);
        const [endHour, endMin] = entry.sleepEnd.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return total + (endMinutes - startMinutes);
      }
      return total;
    }, 0);

    return { feedTotal, peeCount, pooCount, totalSleepMinutes };
  };

  const { feedTotal, peeCount, pooCount, totalSleepMinutes } = getTodayStats();

  const handleFeedSubmit = () => {
    const amount = parseInt(feedAmount);
    if (amount > 0 && amount <= 1000) {
      const now = new Date();
      setPendingFeedTime(now);
      setPendingFeedType(currentFeedType);
      setPendingFeedAmount(amount);
      setFeedAmount("");
      setIsDialogOpen(false);
      setShowFeedTimeEditor(true);
    }
  };

  const confirmFeed = (adjustedTime: Date) => {
    addActivity({
      type: "feed",
      subtype: pendingFeedType,
      amount: pendingFeedAmount,
      icon: pendingFeedType === "formula" ? "🍼" : "🤱",
      time: adjustedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    });

    toast({
      title: "Feed logged",
      description: `${pendingFeedType === "formula" ? "Formula" : "Breast milk"} - ${pendingFeedAmount}ml recorded`,
    });
  };

  const openFeedDialog = (type: "formula" | "breast") => {
    setCurrentFeedType(type);
    setIsDialogOpen(true);
  };

  const handleDiaperCount = (type: "pee" | "poo") => {
    const now = new Date();
    setPendingDiaperTime(now);
    setPendingDiaperType(type);
    setShowDiaperTimeEditor(true);
  };

  const confirmDiaper = (adjustedTime: Date) => {
    addActivity({
      type: "diaper",
      subtype: pendingDiaperType,
      icon: pendingDiaperType === "pee" ? "💧" : "💩",
      time: adjustedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    });
    
    toast({
      title: `${pendingDiaperType === "pee" ? "Pee" : "Poo"} logged`,
      description: "Activity recorded",
      duration: 2000,
    });
  };

  const handleSleepStart = () => {
    if (sleepStartTime) {
      toast({
        title: "Sleep already started",
        description: "Please end current sleep session first",
        variant: "destructive",
      });
      return;
    }
    
    const now = new Date();
    setPendingStartTime(now);
    setShowSleepStartEditor(true);
  };

  const confirmSleepStart = (adjustedTime: Date) => {
    setSleepStartTime(adjustedTime);
    setElapsedTime(Date.now() - adjustedTime.getTime());

    addActivity({
      type: "sleep",
      subtype: "start",
      icon: "😴",
      time: adjustedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    });

    toast({
      title: "Sleep started",
      description: "Timer started",
    });
  };

  const handleSleepEnd = () => {
    if (!sleepStartTime) {
      toast({
        title: "No sleep session",
        description: "Please start sleep first",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    setPendingEndTime(now);
    setShowSleepEndEditor(true);
  };

  const confirmSleepEnd = (adjustedTime: Date) => {
    if (!sleepStartTime) return;
    
    const duration = Math.floor((adjustedTime.getTime() - sleepStartTime.getTime()) / (1000 * 60));
    
    completeSleepSession();
    setSleepStartTime(null);
    setElapsedTime(0);

    toast({
      title: "Sleep ended",
      description: `Sleep duration: ${Math.floor(duration / 60)}h ${duration % 60}m`,
    });
  };

  const formatElapsedTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Baby className="h-8 w-8 text-primary" />
          BabyLog
        </h1>
        <p className="text-muted-foreground mt-2">Today's Activity</p>
      </div>

      {/* Daily Totals */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center bg-gradient-to-br from-feed/20 to-feed/10">
          <Milk className="h-6 w-6 mx-auto text-feed-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Total Feed</p>
          <p className="text-2xl font-bold text-feed-foreground">
            {feedTotal}ml
          </p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-sleep/20 to-sleep/10">
          <Moon className="h-6 w-6 mx-auto text-sleep-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sleep</p>
          <p className="text-2xl font-bold text-sleep-foreground">
            {Math.floor(totalSleepMinutes / 60)}h {totalSleepMinutes % 60}m
          </p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-diaper/20 to-diaper/10">
          <div className="text-2xl mb-2">💧</div>
          <p className="text-sm text-muted-foreground">Pee</p>
          <p className="text-2xl font-bold text-diaper-foreground">
            {peeCount}
          </p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-diaper/20 to-diaper/10">
          <div className="text-2xl mb-2">💩</div>
          <p className="text-sm text-muted-foreground">Poo</p>
          <p className="text-2xl font-bold text-diaper-foreground">
            {pooCount}
          </p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Feed</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="feed" 
              size="lg" 
              className="h-16"
              onClick={() => openFeedDialog("formula")}
            >
              🍼 Formula
            </Button>
            <Button 
              variant="feed" 
              size="lg" 
              className="h-16"
              onClick={() => openFeedDialog("breast")}
            >
              🤱 Breast
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Diaper</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="diaper" 
              size="lg" 
              className="h-16"
              onClick={() => handleDiaperCount("pee")}
            >
              💧 Pee
            </Button>
            <Button 
              variant="diaper" 
              size="lg" 
              className="h-16"
              onClick={() => handleDiaperCount("poo")}
            >
              💩 Poo
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Sleep</h3>
          
          {sleepStartTime && (
            <Card className="p-4 bg-gradient-to-br from-sleep/20 to-sleep/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Moon className="h-5 w-5 text-sleep-foreground" />
                  <span className="text-sm text-muted-foreground">Sleep in progress</span>
                </div>
                <div className="text-2xl font-bold text-sleep-foreground">
                  {formatElapsedTime(elapsedTime)}
                </div>
              </div>
            </Card>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="sleep" 
              size="lg" 
              className="h-16"
              onClick={handleSleepStart}
              disabled={!!sleepStartTime}
            >
              <Play className="h-4 w-4 mr-2" />
              😴 Sleep Start
            </Button>
            <Button 
              variant="sleep" 
              size="lg" 
              className="h-16"
              onClick={handleSleepEnd}
              disabled={!sleepStartTime}
            >
              <Pause className="h-4 w-4 mr-2" />
              🌅 Sleep End
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentFeedType === "formula" ? "Formula" : "Breast Milk"} Amount
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="number"
                placeholder="Enter amount in ml"
                value={feedAmount}
                onChange={(e) => setFeedAmount(e.target.value)}
                min="0"
                max="1000"
                className="text-center text-lg"
              />
              <p className="text-sm text-muted-foreground mt-1 text-center">
                0 - 1000ml
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
                onClick={handleFeedSubmit}
                disabled={!feedAmount || parseInt(feedAmount) <= 0 || parseInt(feedAmount) > 1000}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sleep Start Time Editor */}
      <SleepStartTimeEditor
        open={showSleepStartEditor}
        onOpenChange={setShowSleepStartEditor}
        currentTime={pendingStartTime || new Date()}
        onConfirm={confirmSleepStart}
      />

      {/* Sleep End Time Editor */}
      <SleepEndTimeEditor
        open={showSleepEndEditor}
        onOpenChange={setShowSleepEndEditor}
        currentTime={pendingEndTime || new Date()}
        onConfirm={confirmSleepEnd}
      />

      {/* Feed Time Editor */}
      <TimeEditor
        open={showFeedTimeEditor}
        onOpenChange={setShowFeedTimeEditor}
        currentTime={pendingFeedTime || new Date()}
        onConfirm={confirmFeed}
        title={`Confirm ${pendingFeedType === "formula" ? "Formula" : "Breast Milk"} Time`}
        confirmButtonText="Confirm Feed Time"
      />

      {/* Diaper Time Editor */}
      <TimeEditor
        open={showDiaperTimeEditor}
        onOpenChange={setShowDiaperTimeEditor}
        currentTime={pendingDiaperTime || new Date()}
        onConfirm={confirmDiaper}
        title={`Confirm ${pendingDiaperType === "pee" ? "Pee" : "Poo"} Time`}
        confirmButtonText="Confirm Time"
      />
    </div>
  );
};

export default Dashboard;