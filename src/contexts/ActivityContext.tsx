import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ActivityEntry {
  id: string;
  time: string;
  type: 'feed' | 'diaper' | 'sleep';
  subtype: string;
  amount?: number;
  icon: string;
  timestamp: Date;
}

export interface DayHistory {
  date: string;
  entries: ActivityEntry[];
}

interface ActivityContextType {
  history: DayHistory[];
  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  deleteActivity: (entryId: string) => void;
  sleepStartTime: Date | null;
  setSleepStartTime: (time: Date | null) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sleepStartTime, setSleepStartTime] = useState<Date | null>(null);
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
    const timeString = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const newEntry: ActivityEntry = {
      ...activity,
      id: Date.now().toString(),
      time: timeString,
      timestamp: now
    };

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

  const deleteActivity = (entryId: string) => {
    setHistory(prev => 
      prev.map(day => ({
        ...day,
        entries: day.entries.filter(entry => entry.id !== entryId)
      })).filter(day => day.entries.length > 0)
    );
  };

  return (
    <ActivityContext.Provider value={{
      history,
      addActivity,
      deleteActivity,
      sleepStartTime,
      setSleepStartTime
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