import path from 'path';
import fs from 'fs';

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

interface DatabaseData {
  tasks: Task[];
  task_logs: TaskLog[];
}

class TaskDatabase {
  private data: DatabaseData;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'tasks.json');
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = { tasks: [], task_logs: [] };
        this.saveDatabase();
      }
    } catch (error) {
      console.error('Error loading database:', error);
      this.data = { tasks: [], task_logs: [] };
    }
  }

  private saveDatabase() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Task operations
  createTask(task: Task): Promise<Task> {
    return new Promise((resolve, reject) => {
      try {
        this.data.tasks.push(task);
        this.saveDatabase();
        resolve(task);
      } catch (error) {
        reject(error);
      }
    });
  }

  getAllTasksWithLogs(): Promise<TaskWithLogs[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const tasks = [...this.data.tasks].sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        
        const tasksWithLogs = await Promise.all(
          tasks.map(async task => ({
            ...task,
            logs: await this.getTaskLogs(task.id)
          }))
        );
        
        resolve(tasksWithLogs);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTaskById(id: string): Promise<Task | null> {
    return new Promise((resolve, reject) => {
      try {
        const task = this.data.tasks.find(t => t.id === id);
        resolve(task || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const taskIndex = this.data.tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
          resolve(false);
          return;
        }

        this.data.tasks[taskIndex] = { ...this.data.tasks[taskIndex], ...updates };
        this.saveDatabase();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteTask(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const taskIndex = this.data.tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
          resolve(false);
          return;
        }

        this.data.tasks.splice(taskIndex, 1);
        // Also delete related logs
        this.data.task_logs = this.data.task_logs.filter(log => log.taskId !== id);
        this.saveDatabase();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Task log operations
  getTaskLogs(taskId: string): Promise<TaskLog[]> {
    return new Promise((resolve, reject) => {
      try {
        const logs = this.data.task_logs
          .filter(log => log.taskId === taskId)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(logs);
      } catch (error) {
        reject(error);
      }
    });
  }

  addTaskLog(log: TaskLog): Promise<TaskLog> {
    return new Promise((resolve, reject) => {
      try {
        this.data.task_logs.push(log);
        this.saveDatabase();
        resolve(log);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateTaskLog(logId: string, message: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const logIndex = this.data.task_logs.findIndex(log => log.id === logId);
        if (logIndex === -1) {
          resolve(false);
          return;
        }

        this.data.task_logs[logIndex].message = message;
        this.saveDatabase();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteTaskLog(logId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const logIndex = this.data.task_logs.findIndex(log => log.id === logId);
        if (logIndex === -1) {
          resolve(false);
          return;
        }

        this.data.task_logs.splice(logIndex, 1);
        this.saveDatabase();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
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

  close() {
    this.db.close();
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
export function initDatabase() {
  getDatabase();
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