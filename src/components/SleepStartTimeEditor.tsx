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
  const [adjustedTime, setAdjustedTime] = useState(
    currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );

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
            <Input
              id="startTime"
              type="time"
              value={adjustedTime}
              onChange={(e) => setAdjustedTime(e.target.value)}
              className="col-span-3"
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