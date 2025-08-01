"use client";

import { useState, useEffect } from 'react';
import { Plus, Clock, Play, Square, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '@/components/TaskCard';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { ScheduleTaskDialog } from '@/components/ScheduleTaskDialog';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime: Date;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  completedTime?: Date;
  elapsedTime: number; // in seconds
  logs: TaskLog[];
}

export interface TaskLog {
  id: string;
  message: string;
  timestamp: Date;
  isEditable?: boolean;
}

// API helper functions
async function fetchTasks(): Promise<Task[]> {
  const response = await fetch('/api/tasks');
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  
  // Convert string dates back to Date objects
  return result.data.map((task: any) => ({
    ...task,
    startTime: new Date(task.startTime),
    scheduledStartTime: task.scheduledStartTime ? new Date(task.scheduledStartTime) : undefined,
    scheduledEndTime: task.scheduledEndTime ? new Date(task.scheduledEndTime) : undefined,
    completedTime: task.completedTime ? new Date(task.completedTime) : undefined,
    logs: task.logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
      isEditable: Boolean(log.isEditable)
    }))
  }));
}

async function createTaskAPI(title: string, description: string): Promise<void> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function scheduleTaskAPI(title: string, description: string, scheduledStart: Date, scheduledEnd: Date): Promise<void> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      title, 
      description, 
      scheduledStartTime: scheduledStart.toISOString(),
      scheduledEndTime: scheduledEnd.toISOString()
    })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function startTaskAPI(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks?action=start&id=${taskId}`, {
    method: 'POST'
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function completeTaskAPI(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks?action=complete&id=${taskId}`, {
    method: 'POST'
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function addLogAPI(taskId: string, message: string): Promise<void> {
  const response = await fetch(`/api/tasks?action=addLog&id=${taskId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function updateLogAPI(taskId: string, logId: string, message: string): Promise<void> {
  const response = await fetch(`/api/tasks?action=updateLog&id=${taskId}&logId=${logId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function deleteLogAPI(taskId: string, logId: string): Promise<void> {
  const response = await fetch(`/api/tasks?action=deleteLog&id=${taskId}&logId=${logId}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Update elapsed time for in-progress tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.status === 'in-progress') {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - task.startTime.getTime()) / 1000);
            return { ...task, elapsedTime: elapsed };
          }
          return task;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (title: string, description: string) => {
    try {
      await createTaskAPI(title, description);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const scheduleTask = async (title: string, description: string, scheduledStart: Date, scheduledEnd: Date) => {
    try {
      await scheduleTaskAPI(title, description, scheduledStart, scheduledEnd);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to schedule task:', error);
    }
  };

  const startScheduledTask = async (taskId: string) => {
    try {
      await startTaskAPI(taskId);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await completeTaskAPI(taskId);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const addLog = async (taskId: string, message: string) => {
    try {
      await addLogAPI(taskId, message);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to add log:', error);
    }
  };

  const updateLog = async (taskId: string, logId: string, newMessage: string) => {
    try {
      await updateLogAPI(taskId, logId, newMessage);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to update log:', error);
    }
  };

  const deleteLog = async (taskId: string, logId: string) => {
    try {
      await deleteLogAPI(taskId, logId);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Task Manager</h1>
            <p className="text-gray-400">Track your tasks with precision timing</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsScheduleDialogOpen(true)}
              variant="outline"
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold"
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule Task
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Task Now
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-400">{scheduledTasks.length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Tasks</p>
                  <p className="text-2xl font-bold text-yellow-400">{inProgressTasks.length}</p>
                </div>
                <Play className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{completedTasks.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{tasks.length}</p>
                </div>
                <Square className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Tasks */}
        {scheduledTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-400 mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2" />
              Scheduled Tasks ({scheduledTasks.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {scheduledTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onComplete={completeTask}
                  onStart={startScheduledTask}
                  onAddLog={addLog}
                  onUpdateLog={updateLog}
                  onDeleteLog={deleteLog}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2" />
              Active Tasks ({inProgressTasks.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onComplete={completeTask}
                  onStart={startScheduledTask}
                  onAddLog={addLog}
                  onUpdateLog={updateLog}
                  onDeleteLog={deleteLog}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-green-400 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Completed Tasks ({completedTasks.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {completedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onComplete={completeTask}
                  onStart={startScheduledTask}
                  onAddLog={addLog}
                  onUpdateLog={updateLog}
                  onDeleteLog={deleteLog}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-6">Create your first task to start tracking your productivity</p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => setIsScheduleDialogOpen(true)}
                variant="outline"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold"
              >
                <Clock className="w-4 h-4 mr-2" />
                Schedule Task
              </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Task Now
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateTaskDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={createTask}
      />
      
      <ScheduleTaskDialog 
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onScheduleTask={scheduleTask}
      />
    </div>
  );
}