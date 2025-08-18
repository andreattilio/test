import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityEntry, useActivity } from '@/contexts/ActivityContext';
import { Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditEntryDialogProps {
  entry: ActivityEntry;
}

export const EditEntryDialog: React.FC<EditEntryDialogProps> = ({ entry }) => {
  const { editActivity } = useActivity();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(entry.time);
  const [amount, setAmount] = useState(entry.amount || 0);
  const [sleepStart, setSleepStart] = useState(entry.sleepStart || '');
  const [sleepEnd, setSleepEnd] = useState(entry.sleepEnd || '');

  const handleSave = () => {
    const updatedEntry: ActivityEntry = {
      ...entry,
      time,
      ...(entry.type === 'feed' && { amount }),
      ...(entry.type === 'sleep' && {
        sleepStart,
        sleepEnd,
        sleepDuration: calculateSleepDuration(sleepStart, sleepEnd)
      })
    };

    editActivity(updatedEntry);
    setOpen(false);
    toast({
      title: "Entry updated",
      description: "Your activity entry has been successfully updated."
    });
  };

  const calculateSleepDuration = (start: string, end: string): string => {
    if (!start || !end) return '';
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight sleep
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const duration = endMinutes - startMinutes;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {entry.type !== 'sleep' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}

          {entry.type === 'feed' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (ml)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="col-span-3"
                min="0"
              />
            </div>
          )}

          {entry.type === 'sleep' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sleepStart" className="text-right">
                  Sleep Start
                </Label>
                <Input
                  id="sleepStart"
                  type="time"
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sleepEnd" className="text-right">
                  Sleep End
                </Label>
                <Input
                  id="sleepEnd"
                  type="time"
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};