"use client";

import { Task } from '@/app/page';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Play } from 'lucide-react';
import { format } from 'date-fns';

interface TaskBlockProps {
  task: Task;
  height: number;
  onClick?: () => void;
}

export function TaskBlock({ task, height, onClick }: TaskBlockProps) {
  const formatTime = (date: Date): string => {
    return format(date, 'h:mm a');
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'scheduled':
        return 'bg-blue-600 border-blue-500 hover:bg-blue-700';
      case 'in-progress':
        return 'bg-yellow-600 border-yellow-500 hover:bg-yellow-700';
      case 'completed':
        return 'bg-green-600 border-green-500 hover:bg-green-700';
      default:
        return 'bg-gray-600 border-gray-500 hover:bg-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'scheduled':
        return <Clock className="w-3 h-3" />;
      case 'in-progress':
        return <Play className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTimeDisplay = () => {
    if (task.status === 'scheduled' && task.scheduledStartTime && task.scheduledEndTime) {
      return `${formatTime(task.scheduledStartTime)} - ${formatTime(task.scheduledEndTime)}`;
    } else if (task.status === 'completed' && task.completedTime) {
      return `${formatTime(task.startTime)} - ${formatTime(task.completedTime)}`;
    } else {
      return formatTime(task.startTime);
    }
  };

  return (
    <div
      className={`absolute left-0 right-0 mx-1 rounded-lg border-2 cursor-pointer transition-all duration-200 ${getStatusColor()}`}
      style={{ height: `${height}px` }}
      onClick={onClick}
    >
      <div className="p-2 h-full flex flex-col justify-between text-white">
        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-1 mb-1">
            {getStatusIcon()}
            <span className="text-xs font-medium truncate">
              {task.title}
            </span>
          </div>
          
          {height > 40 && (
            <p className="text-xs opacity-90 line-clamp-2 leading-tight">
              {task.description}
            </p>
          )}
        </div>
        
        {height > 60 && (
          <div className="text-xs opacity-80 mt-1">
            {getTimeDisplay()}
          </div>
        )}
      </div>
    </div>
  );
}