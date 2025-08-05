
"use client";
import { getCurrentISTDate, formatIST, toIST } from '@/lib/ist-time-utils';

import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowLeft, Calendar, Target, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Task } from '@/app/page';
import { EditTaskDialog } from '@/components/EditTaskDialog';
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
    startTime: toIST(task.startTime),
    scheduledStartTime: task.scheduledStartTime ? toIST(task.scheduledStartTime) : undefined,
    scheduledEndTime: task.scheduledEndTime ? toIST(task.scheduledEndTime) : undefined,
    completedTime: task.completedTime ? toIST(task.completedTime) : undefined,
    logs: task.logs.map((log: any) => ({
      ...log,
      timestamp: toIST(log.timestamp),
      isEditable: Boolean(log.isEditable)
    }))
  }));
}

export default function TimelinePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(getNavigationDates().today);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentISTDate());
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
      const now = getCurrentISTDate();
      setCurrentTime(now);
      const isViewingToday = toIST(selectedDate).toDateString() === now.toDateString();
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

  const handleUpdateTask = async (updates: Partial<Task>) => {
    if (!updates.id) return;
    setEditLoading(true);
    try {
      const response = await fetch(`/api/tasks?id=${updates.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      await loadTasks();
      setSelectedTask(null);
    } catch (error) {
      alert('Failed to update task.');
      console.error(error);
    } finally {
      setEditLoading(false);
      setEditDialogOpen(false);
    }
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
      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdateTask={handleUpdateTask}
        loading={editLoading}
      />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/">
              <Button 
                variant="outline"
                size="sm"
                className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Timeline View</h1>
              <p className="text-sm md:text-base text-gray-400">24-hour daily schedule</p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <h2 className="text-xl md:text-2xl font-semibold text-yellow-400">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Timeline Column */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Daily Timeline
                  </CardTitle>
                  {toIST(selectedDate).toDateString() === currentTime.toDateString() && (
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
                <ScrollArea className="h-[500px] md:h-[700px]" ref={scrollAreaRef}>
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
                    {toIST(selectedDate).toDateString() === currentTime.toDateString() && (
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
                            {formatIST(currentTime, 'h:mm a')}
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
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="bg-zinc-900 border-zinc-800 lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">
                  {selectedTask ? 'Task Details' : 'Select a Task'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTask ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{selectedTask.title}</h3>
                        <p className="text-sm text-gray-400">{selectedTask.description}</p>
                      </div>
                      <button
                        className="ml-2 p-2 rounded hover:bg-zinc-800 border border-zinc-700 text-yellow-400 flex items-center"
                        title="Edit Task"
                        onClick={() => setEditDialogOpen(true)}
                      >
                        <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="ml-1 text-xs font-semibold hidden md:inline">Edit</span>
                      </button>
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
                            {formatIST(selectedTask.scheduledStartTime, 'h:mm a')}
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
                                  {formatIST(log.timestamp, 'h:mm a')}
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
          <div className="text-center py-8 md:py-12 mt-6 md:mt-8">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-400 mb-2">No tasks for this date</h3>
            <p className="text-sm md:text-base text-gray-500 mb-6 px-4">
              {formatDateDisplay(selectedDate)} has no scheduled or completed tasks
            </p>
            <Link href="/">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold h-11">
                Create New Task
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}