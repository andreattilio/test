import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SleepStartTimeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTime: Date;
  onConfirm: (adjustedTime: Date) => void;
}

export const SleepStartTimeEditor: React.FC<SleepStartTimeEditorProps> = ({
  open,
  onOpenChange,
  currentTime,
  onConfirm
}) => {
  const { toast } = useToast();
  const [adjustedTime, setAdjustedTime] = useState(() => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  const handleConfirm = () => {
    const [hours, minutes] = adjustedTime.split(':').map(Number);
    const newTime = new Date();
    newTime.setHours(hours, minutes, 0, 0);
    
    onConfirm(newTime);
    onOpenChange(false);
    
    toast({
      title: "Sleep start time adjusted",
      description: `Sleep started at ${adjustedTime}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Sleep Start Time</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <input
              id="startTime"
              type="time"
              value={adjustedTime}
              onChange={(e) => setAdjustedTime(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
              data-format="24"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Adjust the sleep start time to when your baby actually fell asleep
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Start Time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};