import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TimeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTime: Date;
  onConfirm: (adjustedTime: Date) => void;
  title: string;
  confirmButtonText?: string;
}

export const TimeEditor: React.FC<TimeEditorProps> = ({
  open,
  onOpenChange,
  currentTime,
  onConfirm,
  title,
  confirmButtonText = "Confirm Time"
}) => {
  const { toast } = useToast();
  const [adjustedTime, setAdjustedTime] = useState(() => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  const handleConfirm = () => {
    const [hours, minutes] = adjustedTime.split(':').map(Number);
    const newTime = new Date(currentTime);
    newTime.setHours(hours, minutes, 0, 0);
    
    onConfirm(newTime);
    onOpenChange(false);
    
    toast({
      title: "Time confirmed",
      description: `Activity time set to ${adjustedTime}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Activity Time
            </label>
            <input
              type="time"
              value={adjustedTime}
              onChange={(e) => setAdjustedTime(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center text-lg"
              data-format="24"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleConfirm}
            >
              {confirmButtonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};