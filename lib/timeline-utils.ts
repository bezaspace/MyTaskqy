import { format, startOfDay, addMinutes, isSameDay, parseISO } from 'date-fns';
import { Task } from '@/app/page';

export interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  displayTime: string;
}

export interface TaskPosition {
  task: Task;
  startSlot: number;
  duration: number; // in 30-minute slots
  top: number; // CSS top position in pixels
  height: number; // CSS height in pixels
}

// Generate 30-minute time slots for full 24-hour cycle
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = format(new Date(2000, 0, 1, hour, minute), 'h:mm a');
      
      slots.push({
        time,
        hour,
        minute,
        displayTime
      });
    }
  }
  
  return slots;
}

// Get slot index for a given time (0-47 for 24-hour cycle)
export function getSlotIndex(date: Date): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  // Calculate slot index (00:00 = slot 0, 00:30 = slot 1, etc.)
  const slotIndex = hour * 2 + (minute >= 30 ? 1 : 0);
  
  return Math.max(0, Math.min(47, slotIndex));
}

// Get precise pixel position for a time within the timeline
export function getPixelPosition(date: Date): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const slotHeight = 60; // pixels per 30-minute slot
  
  // Calculate precise position: each hour = 120px (2 slots), each minute = 2px
  return (hour * 120) + (minute * 2);
}

// Calculate task positions for timeline display
export function calculateTaskPositions(tasks: Task[], selectedDate: Date): TaskPosition[] {
  const positions: TaskPosition[] = [];
  const now = new Date();
  
  // Filter tasks for the selected date
  const dayTasks = tasks.filter(task => {
    if (task.scheduledStartTime) {
      return isSameDay(task.scheduledStartTime, selectedDate);
    }
    return isSameDay(task.startTime, selectedDate);
  });
  
  dayTasks.forEach(task => {
    let startTime: Date;
    let endTime: Date;
    
    if (task.status === 'scheduled' && task.scheduledStartTime && task.scheduledEndTime) {
      startTime = task.scheduledStartTime;
      endTime = task.scheduledEndTime;
    } else {
      startTime = task.startTime;
      if (task.status === 'completed' && task.completedTime) {
        endTime = task.completedTime;
      } else if (task.status === 'in-progress') {
        // For in-progress tasks, calculate real-time end position
        if (isSameDay(startTime, now)) {
          // Use current time for tasks in progress today
          endTime = now;
        } else {
          // For past in-progress tasks, use elapsed time
          endTime = new Date(startTime.getTime() + task.elapsedTime * 1000);
        }
      } else {
        // Default to 30 minutes if no end time
        endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      }
    }
    
    const startPixel = getPixelPosition(startTime);
    const endPixel = getPixelPosition(endTime);
    const height = Math.max(20, endPixel - startPixel); // Minimum 20px height
    
    const startSlot = getSlotIndex(startTime);
    const endSlot = getSlotIndex(endTime);
    const duration = Math.max(1, endSlot - startSlot + 1);
    
    positions.push({
      task,
      startSlot,
      duration,
      top: startPixel,
      height: height - 2 // -2px for gap between tasks
    });
  });
  
  return positions;
}

// Format date for display
export function formatDateDisplay(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

// Get today, yesterday, tomorrow dates
export function getNavigationDates() {
  const today = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  return { today, yesterday, tomorrow };
}