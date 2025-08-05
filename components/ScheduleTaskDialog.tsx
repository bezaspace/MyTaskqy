"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleTask: (title: string, description: string, startTime: Date, endTime: Date) => void;
}

export function ScheduleTaskDialog({ open, onOpenChange, onScheduleTask }: ScheduleTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim() && startDate && startTime && endDate && endTime) {
      const scheduledStart = new Date(`${startDate}T${startTime}`);
      const scheduledEnd = new Date(`${endDate}T${endTime}`);
      
      if (scheduledEnd > scheduledStart) {
        onScheduleTask(title, description, scheduledStart, scheduledEnd);
        setTitle('');
        setDescription('');
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
        onOpenChange(false);
      } else {
        alert('End time must be after start time');
      }
    }
  };

  // Set default values when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !startDate) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      setStartDate(today);
      setStartTime(currentTime);
      setEndDate(today);
      
      // Set end time to 1 hour later
      const endDateTime = new Date(now.getTime() + 60 * 60 * 1000);
      setEndTime(endDateTime.toTimeString().slice(0, 5));
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-400">
            Schedule New Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">
              Task Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 mt-1 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate" className="text-gray-300">
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime" className="text-gray-300">
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="endDate" className="text-gray-300">
                End Date *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-gray-300">
                End Time *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800 h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
            >
              Schedule Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}