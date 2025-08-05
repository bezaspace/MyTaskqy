"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Task } from '@/app/page';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdateTask: (updates: Partial<Task>) => void;
  loading?: boolean;
}

export function EditTaskDialog({ open, onOpenChange, task, onUpdateTask, loading }: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      // Use scheduled times if available, else fallback to startTime
      const start = task.scheduledStartTime || task.startTime;
      const end = task.scheduledEndTime || task.completedTime || task.startTime;
      const startObj = new Date(start);
      const endObj = new Date(end);
      setStartDate(startObj.toISOString().split('T')[0]);
      setStartTime(startObj.toTimeString().slice(0, 5));
      setEndDate(endObj.toISOString().split('T')[0]);
      setEndTime(endObj.toTimeString().slice(0, 5));
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (title.trim() && startDate && startTime && endDate && endTime) {
      const scheduledStart = new Date(`${startDate}T${startTime}`);
      const scheduledEnd = new Date(`${endDate}T${endTime}`);
      if (scheduledEnd > scheduledStart) {
        onUpdateTask({
          id: task.id,
          title,
          description,
          scheduledStartTime: scheduledStart,
          scheduledEndTime: scheduledEnd,
        });
        onOpenChange(false);
      } else {
        alert('End time must be after start time');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-yellow-400">
            Edit Task
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
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
