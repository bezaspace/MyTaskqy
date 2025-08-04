"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getNavigationDates } from '@/lib/timeline-utils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const { today, yesterday, tomorrow } = getNavigationDates();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const newDate = new Date(dateValue + 'T00:00:00');
      onDateChange(newDate);
      setShowDatePicker(false);
    }
  };

  const isToday = selectedDate.toDateString() === today.toDateString();
  const isYesterday = selectedDate.toDateString() === yesterday.toDateString();
  const isTomorrow = selectedDate.toDateString() === tomorrow.toDateString();

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onDateChange(yesterday)}
          variant={isYesterday ? "default" : "outline"}
          size="sm"
          className={isYesterday 
            ? "bg-yellow-400 text-black hover:bg-yellow-500" 
            : "border-zinc-700 text-gray-300 hover:bg-zinc-800"
          }
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Yesterday
        </Button>
        
        <Button
          onClick={() => onDateChange(today)}
          variant={isToday ? "default" : "outline"}
          size="sm"
          className={isToday 
            ? "bg-yellow-400 text-black hover:bg-yellow-500" 
            : "border-zinc-700 text-gray-300 hover:bg-zinc-800"
          }
        >
          Today
        </Button>
        
        <Button
          onClick={() => onDateChange(tomorrow)}
          variant={isTomorrow ? "default" : "outline"}
          size="sm"
          className={isTomorrow 
            ? "bg-yellow-400 text-black hover:bg-yellow-500" 
            : "border-zinc-700 text-gray-300 hover:bg-zinc-800"
          }
        >
          Tomorrow
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setShowDatePicker(!showDatePicker)}
          variant="outline"
          size="sm"
          className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {format(selectedDate, 'MMM d, yyyy')}
        </Button>
        
        {showDatePicker && (
          <Input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateInput}
            className="w-auto bg-zinc-800 border-zinc-700 text-white"
            onBlur={() => setShowDatePicker(false)}
            autoFocus
          />
        )}
      </div>
    </div>
  );
}