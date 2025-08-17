import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Baby, Milk, Moon, RotateCcw } from "lucide-react";

interface DailyTotals {
  feedFormula: number;
  feedBreast: number;
  peeCount: number;
  pooCount: number;
  sleepHours: number;
}

const Dashboard = () => {
  const [totals, setTotals] = useState<DailyTotals>({
    feedFormula: 120,
    feedBreast: 80,
    peeCount: 6,
    pooCount: 3,
    sleepHours: 8.5,
  });

  const [feedAmount, setFeedAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFeedType, setCurrentFeedType] = useState<"formula" | "breast">("formula");

  const handleFeedSubmit = () => {
    const amount = parseInt(feedAmount);
    if (amount > 0 && amount <= 1000) {
      setTotals(prev => ({
        ...prev,
        [currentFeedType === "formula" ? "feedFormula" : "feedBreast"]: prev[currentFeedType === "formula" ? "feedFormula" : "feedBreast"] + amount
      }));
      setFeedAmount("");
      setIsDialogOpen(false);
    }
  };

  const openFeedDialog = (type: "formula" | "breast") => {
    setCurrentFeedType(type);
    setIsDialogOpen(true);
  };

  const addDiaperCount = (type: "pee" | "poo") => {
    setTotals(prev => ({
      ...prev,
      [type === "pee" ? "peeCount" : "pooCount"]: prev[type === "pee" ? "peeCount" : "pooCount"] + 1
    }));
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
            {totals.feedFormula + totals.feedBreast}ml
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formula: {totals.feedFormula}ml • Breast: {totals.feedBreast}ml
          </p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-sleep/20 to-sleep/10">
          <Moon className="h-6 w-6 mx-auto text-sleep-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sleep</p>
          <p className="text-2xl font-bold text-sleep-foreground">
            {totals.sleepHours}h
          </p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-diaper/20 to-diaper/10">
          <div className="text-2xl mb-2">💧</div>
          <p className="text-sm text-muted-foreground">Pee</p>
          <p className="text-2xl font-bold text-diaper-foreground">
            {totals.peeCount}
          </p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-diaper/20 to-diaper/10">
          <div className="text-2xl mb-2">💩</div>
          <p className="text-sm text-muted-foreground">Poo</p>
          <p className="text-2xl font-bold text-diaper-foreground">
            {totals.pooCount}
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
              onClick={() => addDiaperCount("pee")}
            >
              💧 Pee
            </Button>
            <Button 
              variant="diaper" 
              size="lg" 
              className="h-16"
              onClick={() => addDiaperCount("poo")}
            >
              💩 Poo
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Sleep</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="sleep" size="lg" className="h-16">
              😴 Sleep Start
            </Button>
            <Button variant="sleep" size="lg" className="h-16">
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
                variant="default" 
                className="flex-1" 
                onClick={handleFeedSubmit}
                disabled={!feedAmount || parseInt(feedAmount) <= 0 || parseInt(feedAmount) > 1000}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;