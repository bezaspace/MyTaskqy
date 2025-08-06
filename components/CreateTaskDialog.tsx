"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (title: string, description: string, scheduledStartTime?: string, scheduledEndTime?: string) => void;
}

export function CreateTaskDialog({ open, onOpenChange, onCreateTask }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateTask(
        title,
        description,
        scheduledStartTime ? new Date(scheduledStartTime).toISOString() : undefined,
        scheduledEndTime ? new Date(scheduledEndTime).toISOString() : undefined
      );
      setTitle('');
      setDescription('');
      setScheduledStartTime('');
      setScheduledEndTime('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-yellow-400">
            Create New Task
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
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 mt-1 min-h-[100px]"
            />
          </div>
          <div>
            <Label htmlFor="scheduledStartTime" className="text-gray-300">
              Scheduled Start Time
            </Label>
            <Input
              id="scheduledStartTime"
              type="datetime-local"
              value={scheduledStartTime}
              onChange={(e) => setScheduledStartTime(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="scheduledEndTime" className="text-gray-300">
              Scheduled End Time
            </Label>
            <Input
              id="scheduledEndTime"
              type="datetime-local"
              value={scheduledEndTime}
              onChange={(e) => setScheduledEndTime(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 mt-1"
            />
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
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold h-11"
            >
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}