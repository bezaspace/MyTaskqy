"use client";

import { TimeSlot } from '@/lib/timeline-utils';

interface TimelineSlotProps {
  slot: TimeSlot;
  isHourMark: boolean;
}

export function TimelineSlot({ slot, isHourMark }: TimelineSlotProps) {
  return (
    <div className="relative h-[60px] border-b border-zinc-800">
      {/* Time label - only show on hour marks */}
      {isHourMark && (
        <div className="absolute left-0 top-0 w-16 text-xs text-gray-400 font-mono">
          {slot.displayTime}
        </div>
      )}
      
      {/* Timeline line */}
      <div className="absolute left-16 top-0 bottom-0 w-px bg-zinc-700" />
      
      {/* Hour mark indicator */}
      {isHourMark && (
        <div className="absolute left-14 top-0 w-4 h-px bg-zinc-600" />
      )}
      
      {/* Half-hour mark indicator */}
      {!isHourMark && (
        <div className="absolute left-[60px] top-0 w-2 h-px bg-zinc-800" />
      )}
    </div>
  );
}