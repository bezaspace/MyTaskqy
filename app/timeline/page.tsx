"use client";

import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowLeft, Calendar, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Task } from '@/app/page';
import { DateSelector } from '@/components/DateSelector';
import { TimelineSlot } from '@/components/TimelineSlot';
import { TaskBlock } from '@/components/TaskBlock';
import { 
  generateTimeSlots, 
  calculateTaskPositions, 
  formatDateDisplay,
  getNavigationDates,
  getSlotIndex,
  getPixelPosition
} from '@/lib/timeline-utils';

// API helper function
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

export default function TimelinePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(getNavigationDates().today);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const timeSlots = generateTimeSlots();
  const taskPositions = calculateTaskPositions(tasks, selectedDate);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Real-time updates for current time and in-progress tasks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const isViewingToday = selectedDate.toDateString() === now.toDateString();
      const hasInProgressTasks = tasks.some(task => task.status === 'in-progress');
      
      if (isViewingToday && hasInProgressTasks) {
        // Force re-render to update in-progress task sizes
        setTasks(prevTasks => [...prevTasks]);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedDate, tasks]);

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const scrollToCurrentTime = () => {
    if (scrollAreaRef.current) {
      const scrollPosition = getPixelPosition(currentTime);
      
      scrollAreaRef.current.scrollTo({
        top: scrollPosition - 200, // Offset to center current time
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-400">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button 
                variant="outline"
                size="sm"
                className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Timeline View</h1>
              <p className="text-gray-400">24-hour daily schedule with 30-minute intervals</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-yellow-400">
              {formatDateDisplay(selectedDate)}
            </h2>
            <p className="text-sm text-gray-400">
              {taskPositions.length} task{taskPositions.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <DateSelector 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Timeline Column */}
          <div className="lg:col-span-3">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Daily Timeline
                  </CardTitle>
                  {selectedDate.toDateString() === currentTime.toDateString() && (
                    <Button
                      onClick={scrollToCurrentTime}
                      size="sm"
                      variant="outline"
                      className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Go to Now
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[700px]" ref={scrollAreaRef}>
                  <div className="relative px-6 pb-4">
                    {/* Time slots */}
                    {timeSlots.map((slot, index) => (
                      <TimelineSlot
                        key={slot.time}
                        slot={slot}
                        isHourMark={slot.minute === 0}
                      />
                    ))}
                    
                    {/* Current time indicator (only for today) */}
                    {selectedDate.toDateString() === currentTime.toDateString() && (
                      <div
                        className="absolute left-16 right-6 z-10"
                        style={{
                          top: `${getPixelPosition(currentTime)}px`
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div className="flex-1 h-0.5 bg-red-500"></div>
                          <div className="text-xs text-red-500 ml-2 bg-black px-1 rounded">
                            {currentTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Task blocks */}
                    <div className="absolute left-20 right-6 top-0">
                      {taskPositions.map((position, index) => (
                        <div
                          key={position.task.id}
                          className="absolute"
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            left: 0,
                            right: 0
                          }}
                        >
                          <TaskBlock
                            task={position.task}
                            height={position.height}
                            onClick={() => handleTaskClick(position.task)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Task Details Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">
                  {selectedTask ? 'Task Details' : 'Select a Task'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTask ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">{selectedTask.title}</h3>
                      <p className="text-sm text-gray-400">{selectedTask.description}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={
                          selectedTask.status === 'scheduled' ? 'text-blue-400' :
                          selectedTask.status === 'in-progress' ? 'text-yellow-400' :
                          'text-green-400'
                        }>
                          {selectedTask.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      {selectedTask.scheduledStartTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Scheduled:</span>
                          <span className="text-white">
                            {selectedTask.scheduledStartTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      )}
                      
                      {selectedTask.logs.length > 0 && (
                        <div>
                          <span className="text-gray-400">Recent Activity:</span>
                          <div className="mt-2 space-y-1">
                            {selectedTask.logs.slice(-3).map((log) => (
                              <div key={log.id} className="text-xs p-2 bg-zinc-800 rounded">
                                <p className="text-gray-300">{log.message}</p>
                                <p className="text-gray-500 mt-1">
                                  {log.timestamp.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Click on a task in the timeline to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Empty State */}
        {taskPositions.length === 0 && (
          <div className="text-center py-12 mt-8">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks for this date</h3>
            <p className="text-gray-500 mb-6">
              {formatDateDisplay(selectedDate)} has no scheduled or completed tasks
            </p>
            <Link href="/">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                Create New Task
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}