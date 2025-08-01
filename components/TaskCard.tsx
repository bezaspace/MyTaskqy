"use client";

import { useState } from 'react';
import { Clock, MessageSquare, CheckCircle, Calendar, Timer, Play, Edit2, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Task, TaskLog } from '@/app/page';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onStart: (taskId: string) => void;
  onAddLog: (taskId: string, message: string) => void;
  onUpdateLog: (taskId: string, logId: string, message: string) => void;
  onDeleteLog: (taskId: string, logId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onComplete, onStart, onAddLog, onUpdateLog, onDeleteLog, onDelete }: TaskCardProps) {
  const [newLogMessage, setNewLogMessage] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogMessage, setEditingLogMessage] = useState('');

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddLog = () => {
    if (newLogMessage.trim()) {
      onAddLog(task.id, newLogMessage.trim());
      setNewLogMessage('');
    }
  };

  const handleEditLog = (log: TaskLog) => {
    setEditingLogId(log.id);
    setEditingLogMessage(log.message);
  };

  const handleSaveLog = () => {
    if (editingLogId && editingLogMessage.trim()) {
      onUpdateLog(task.id, editingLogId, editingLogMessage.trim());
      setEditingLogId(null);
      setEditingLogMessage('');
    }
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditingLogMessage('');
  };

  const handleDeleteLog = (logId: string) => {
    onDeleteLog(task.id, logId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLog();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveLog();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const totalTime = task.status === 'completed' && task.completedTime 
    ? Math.floor((task.completedTime.getTime() - task.startTime.getTime()) / 1000)
    : task.elapsedTime;

  const getStatusBadge = () => {
    switch (task.status) {
      case 'scheduled':
        return (
          <Badge className="bg-blue-900 text-blue-300 hover:bg-blue-800">
            Scheduled
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-yellow-400 text-black hover:bg-yellow-500">
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-900 text-green-300 hover:bg-green-800">
            Completed
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-white mb-2">
              {task.title}
            </CardTitle>
            <p className="text-sm text-gray-400 line-clamp-2">
              {task.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              onClick={() => onDelete(task.id)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scheduled Time Info */}
        {task.status === 'scheduled' && task.scheduledStartTime && task.scheduledEndTime && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-blue-400">
              <Calendar className="w-4 h-4 mr-1" />
              Scheduled: {formatDateTime(task.scheduledStartTime)} - {formatDateTime(task.scheduledEndTime)}
            </div>
          </div>
        )}

        {/* Time Info for In-Progress and Completed */}
        {task.status !== 'scheduled' && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              Started: {formatDateTime(task.startTime)}
            </div>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              <span className={task.status === 'in-progress' ? 'text-yellow-400 font-mono' : 'text-green-400 font-mono'}>
                {formatTime(totalTime)}
              </span>
            </div>
          </div>
        )}

        {task.status === 'completed' && task.completedTime && (
          <div className="text-sm text-gray-400 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed: {formatDateTime(task.completedTime)}
          </div>
        )}

        <Separator className="bg-zinc-800" />

        {/* Logs Section */}
        <div>
          <div className="flex items-center mb-2">
            <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              Activity Log ({task.logs.length})
            </span>
          </div>
          
          <ScrollArea className="h-32 w-full">
            <div className="space-y-2">
              {task.logs.map((log) => (
                <div key={log.id} className="text-xs p-2 bg-zinc-800 rounded border-l-2 border-yellow-400">
                  <p className="text-gray-300 mb-1">{log.message}</p>
                  <p className="text-gray-500">{formatDateTime(log.timestamp)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Add Log Input (for scheduled and in-progress tasks) */}
        {(task.status === 'scheduled' || task.status === 'in-progress') && (
          <div className="flex gap-2">
            <Input
              placeholder="Add a log entry..."
              value={newLogMessage}
              onChange={(e) => setNewLogMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            <Button 
              onClick={handleAddLog}
              size="sm"
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Add
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {task.status === 'scheduled' && (
          <Button 
            onClick={() => onStart(task.id)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Task
          </Button>
        )}
        
        {task.status === 'in-progress' && (
          <Button 
            onClick={() => onComplete(task.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}