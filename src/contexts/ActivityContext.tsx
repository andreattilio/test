import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ActivityEntry {
  id: string;
  time: string;
  type: 'feed' | 'diaper' | 'sleep';
  subtype: string;
  amount?: number;
  icon: string;
  timestamp: Date;
  sleepStart?: string;
  sleepEnd?: string;
  sleepDuration?: string;
}

export interface DayHistory {
  date: string;
  entries: ActivityEntry[];
}

interface ActivityContextType {
  history: DayHistory[];
  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  deleteActivity: (entryId: string) => void;
  editActivity: (updatedEntry: ActivityEntry) => void;
  sleepStartTime: Date | null;
  setSleepStartTime: (time: Date | null) => void;
  completeSleepSession: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sleepStartTime, setSleepStartTime] = useState<Date | null>(null);
  const [pendingSleepId, setPendingSleepId] = useState<string | null>(null);
  const [history, setHistory] = useState<DayHistory[]>(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        date: today.toISOString().split('T')[0],
        entries: [
          { 
            id: "1", 
            time: "14:30", 
            type: "feed", 
            subtype: "formula", 
            amount: 120, 
            icon: "🍼",
            timestamp: new Date()
          },
          { 
            id: "2", 
            time: "13:45", 
            type: "diaper", 
            subtype: "pee", 
            icon: "💧",
            timestamp: new Date()
          },
        ]
      }
    ];
  });

  const addActivity = (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Use provided time or generate current time
    const timeString = activity.time || now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Create timestamp from the time string if provided, otherwise use now
    let timestamp = now;
    if (activity.time) {
      const [hours, minutes] = activity.time.split(':').map(Number);
      timestamp = new Date();
      timestamp.setHours(hours, minutes, 0, 0);
    }

    const newEntry: ActivityEntry = {
      ...activity,
      id: Date.now().toString(),
      time: timeString,
      timestamp: timestamp
    };

    // For sleep start, just store the start time and create placeholder
    if (activity.type === 'sleep' && activity.subtype === 'start') {
      setPendingSleepId(newEntry.id);
      // Don't add to history yet, wait for sleep end
      return;
    }

    setHistory(prev => {
      const existingDayIndex = prev.findIndex(day => day.date === today);
      
      if (existingDayIndex >= 0) {
        const updatedHistory = [...prev];
        updatedHistory[existingDayIndex] = {
          ...updatedHistory[existingDayIndex],
          entries: [newEntry, ...updatedHistory[existingDayIndex].entries]
        };
        return updatedHistory;
      } else {
        return [{
          date: today,
          entries: [newEntry]
        }, ...prev];
      }
    });
  };

  const completeSleepSession = () => {
    if (!sleepStartTime || !pendingSleepId) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const duration = Math.floor((now.getTime() - sleepStartTime.getTime()) / (1000 * 60));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    const sleepEntry: ActivityEntry = {
      id: pendingSleepId,
      type: 'sleep',
      subtype: 'session',
      icon: '😴',
      time: sleepStartTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      timestamp: sleepStartTime,
      sleepStart: sleepStartTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      sleepEnd: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      sleepDuration: `${hours}h ${minutes}m`
    };

    setHistory(prev => {
      const existingDayIndex = prev.findIndex(day => day.date === today);
      
      if (existingDayIndex >= 0) {
        const updatedHistory = [...prev];
        updatedHistory[existingDayIndex] = {
          ...updatedHistory[existingDayIndex],
          entries: [sleepEntry, ...updatedHistory[existingDayIndex].entries]
        };
        return updatedHistory;
      } else {
        return [{
          date: today,
          entries: [sleepEntry]
        }, ...prev];
      }
    });

    setPendingSleepId(null);
  };

  const deleteActivity = (entryId: string) => {
    setHistory(prev => 
      prev.map(day => ({
        ...day,
        entries: day.entries.filter(entry => entry.id !== entryId)
      })).filter(day => day.entries.length > 0)
    );
  };

  const editActivity = (updatedEntry: ActivityEntry) => {
    setHistory(prev => 
      prev.map(day => ({
        ...day,
        entries: day.entries.map(entry => 
          entry.id === updatedEntry.id ? updatedEntry : entry
        )
      }))
    );
  };

  return (
    <ActivityContext.Provider value={{
      history,
      addActivity,
      deleteActivity,
      editActivity,
      sleepStartTime,
      setSleepStartTime,
      completeSleepSession
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};