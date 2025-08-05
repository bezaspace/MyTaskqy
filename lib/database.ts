import { supabase } from './supabase';

// Helper functions to map between camelCase (API) and lowercase (database)
function taskToDb(task: Partial<Task>): any {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    starttime: task.startTime,
    scheduledstarttime: task.scheduledStartTime,
    scheduledendtime: task.scheduledEndTime,
    completedtime: task.completedTime,
    elapsedtime: task.elapsedTime
  };
}

function taskFromDb(dbTask: any): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status,
    startTime: dbTask.starttime,
    scheduledStartTime: dbTask.scheduledstarttime,
    scheduledEndTime: dbTask.scheduledendtime,
    completedTime: dbTask.completedtime,
    elapsedTime: dbTask.elapsedtime
  };
}

function taskLogToDb(log: Partial<TaskLog>): any {
  return {
    id: log.id,
    taskid: log.taskId,
    message: log.message,
    timestamp: log.timestamp,
    iseditable: log.isEditable
  };
}

function taskLogFromDb(dbLog: any): TaskLog {
  return {
    id: dbLog.id,
    taskId: dbLog.taskid,
    message: dbLog.message,
    timestamp: dbLog.timestamp,
    isEditable: dbLog.iseditable
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  completedTime?: string;
  elapsedTime: number;
}

export interface TaskLog {
  id: string;
  taskId: string;
  message: string;
  timestamp: string;
  isEditable: number;
}

export interface TaskWithLogs extends Task {
  logs: TaskLog[];
}

class TaskDatabase {
  constructor() {
    // No initialization needed for Supabase
  }

  public async initializeDatabase() {
    // No initialization needed for Supabase - tables should already exist
    console.log('Database initialized (Supabase)');
  }

  // Task operations
  async createTask(task: Task): Promise<Task> {
    const dbTask = taskToDb(task);
    // Filter out undefined values
    const filteredTask = Object.fromEntries(
      Object.entries(dbTask).filter(([_, value]) => value !== undefined)
    );

    const { error } = await supabase
      .from('tasks')
      .insert(filteredTask);

    if (error) {
      throw error;
    }

    return task;
  }

  async getAllTasksWithLogs(): Promise<TaskWithLogs[]> {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('starttime', { ascending: false });

    if (error) {
      throw error;
    }

    const tasksWithLogs = await Promise.all(
      (tasks || []).map(async dbTask => {
        const task = taskFromDb(dbTask);
        return {
          ...task,
          logs: await this.getTaskLogs(task.id)
        };
      })
    );

    return tasksWithLogs;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw error;
    }

    return taskFromDb(data);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    const dbUpdates = taskToDb(updates);
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(dbUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return false;
    }

    const { error } = await supabase
      .from('tasks')
      .update(filteredUpdates)
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  async deleteTask(id: string): Promise<boolean> {
    // Delete task logs first (due to foreign key constraint)
    await supabase
      .from('task_logs')
      .delete()
      .eq('taskid', id);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  // Task log operations
  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    const { data, error } = await supabase
      .from('task_logs')
      .select('*')
      .eq('taskid', taskId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(taskLogFromDb);
  }

  async addTaskLog(log: TaskLog): Promise<TaskLog> {
    const dbLog = taskLogToDb(log);
    const { error } = await supabase
      .from('task_logs')
      .insert(dbLog);

    if (error) {
      throw error;
    }

    return log;
  }

  async updateTaskLog(logId: string, message: string): Promise<boolean> {
    const { error } = await supabase
      .from('task_logs')
      .update({ message })
      .eq('id', logId);

    if (error) {
      throw error;
    }

    return true;
  }

  async deleteTaskLog(logId: string): Promise<boolean> {
    const { error } = await supabase
      .from('task_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      throw error;
    }

    return true;
  }

  // Helper methods for specific operations
  async startTask(taskId: string): Promise<boolean> {
    const startTime = new Date().toISOString();
    return await this.updateTask(taskId, {
      status: 'in-progress',
      startTime,
      elapsedTime: 0
    });
  }

  async completeTask(taskId: string): Promise<boolean> {
    const completedTime = new Date().toISOString();
    return await this.updateTask(taskId, {
      status: 'completed',
      completedTime
    });
  }

  async close() {
    // No cleanup needed for Supabase client
  }
}

// Singleton instance
let dbInstance: TaskDatabase | null = null;

export function getDatabase(): TaskDatabase {
  if (!dbInstance) {
    dbInstance = new TaskDatabase();
  }
  return dbInstance;
}

// Export functions for API routes
export async function initDatabase() {
  const db = getDatabase();
  // Ensure database is initialized
  await db.initializeDatabase();
}

export async function getAllTasks(): Promise<TaskWithLogs[]> {
  return await getDatabase().getAllTasksWithLogs();
}

export async function createTask(data: { title: string; description: string; scheduledStartTime?: string; scheduledEndTime?: string }): Promise<TaskWithLogs> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const taskId = Date.now().toString();

  const task: Task = {
    id: taskId,
    title: data.title,
    description: data.description,
    status: data.scheduledStartTime ? 'scheduled' : 'in-progress',
    startTime: data.scheduledStartTime ? now : now,
    scheduledStartTime: data.scheduledStartTime,
    scheduledEndTime: data.scheduledEndTime,
    elapsedTime: 0
  };

  await db.createTask(task);

  // Add initial log
  const logMessage = data.scheduledStartTime ? 'Task scheduled' : 'Task created and started';
  const log: TaskLog = {
    id: (Date.now() + 1).toString(),
    taskId: taskId,
    message: logMessage,
    timestamp: now,
    isEditable: 1
  };

  await db.addTaskLog(log);

  return {
    ...task,
    logs: [log]
  };
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<TaskWithLogs | null> {
  const db = getDatabase();
  const success = await db.updateTask(taskId, updates);
  if (!success) return null;

  const task = await db.getTaskById(taskId);
  if (!task) return null;

  return {
    ...task,
    logs: await db.getTaskLogs(taskId)
  };
}

export async function deleteTask(taskId: string): Promise<boolean> {
  return await getDatabase().deleteTask(taskId);
}

export async function startTask(taskId: string): Promise<TaskWithLogs | null> {
  const db = getDatabase();
  const success = await db.startTask(taskId);
  if (!success) return null;

  // Add log
  const log: TaskLog = {
    id: Date.now().toString(),
    taskId: taskId,
    message: 'Task started',
    timestamp: new Date().toISOString(),
    isEditable: 1
  };
  await db.addTaskLog(log);

  const task = await db.getTaskById(taskId);
  if (!task) return null;

  return {
    ...task,
    logs: await db.getTaskLogs(taskId)
  };
}

export async function completeTask(taskId: string): Promise<TaskWithLogs | null> {
  const db = getDatabase();
  const success = await db.completeTask(taskId);
  if (!success) return null;

  // Add log
  const log: TaskLog = {
    id: Date.now().toString(),
    taskId: taskId,
    message: 'Task completed',
    timestamp: new Date().toISOString(),
    isEditable: 1
  };
  await db.addTaskLog(log);

  const task = await db.getTaskById(taskId);
  if (!task) return null;

  return {
    ...task,
    logs: await db.getTaskLogs(taskId)
  };
}

export async function addTaskLog(taskId: string, message: string): Promise<TaskLog> {
  const db = getDatabase();
  const log: TaskLog = {
    id: Date.now().toString(),
    taskId: taskId,
    message: message,
    timestamp: new Date().toISOString(),
    isEditable: 1
  };

  return await db.addTaskLog(log);
}

export async function updateTaskLog(taskId: string, logId: string, message: string): Promise<TaskLog | null> {
  const db = getDatabase();
  const success = await db.updateTaskLog(logId, message);
  if (!success) return null;

  const logs = await db.getTaskLogs(taskId);
  return logs.find(log => log.id === logId) || null;
}

export async function deleteTaskLog(taskId: string, logId: string): Promise<boolean> {
  return await getDatabase().deleteTaskLog(logId);
}

export default TaskDatabase;