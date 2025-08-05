import { initializeSQLiteDatabase, migrateFromJSON, DatabaseConnection } from './sqlite-setup';

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
  private connection: DatabaseConnection | null = null;

  constructor() {
    this.initializeDatabase();
  }

  public async initializeDatabase() {
    try {
      this.connection = await initializeSQLiteDatabase();
      await migrateFromJSON(this.connection);
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async ensureConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      this.connection = await initializeSQLiteDatabase();
    }
    return this.connection;
  }

  // Task operations
  async createTask(task: Task): Promise<Task> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const stmt = connection.db.prepare(`
        INSERT INTO tasks (id, title, description, status, startTime, scheduledStartTime, scheduledEndTime, completedTime, elapsedTime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        task.id,
        task.title,
        task.description,
        task.status,
        task.startTime,
        task.scheduledStartTime || null,
        task.scheduledEndTime || null,
        task.completedTime || null,
        task.elapsedTime
      ], function (err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(task);
        }
      });
    });
  }

  async getAllTasksWithLogs(): Promise<TaskWithLogs[]> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      connection.db.all(`
        SELECT * FROM tasks 
        ORDER BY startTime DESC
      `, async (err, tasks: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        try {
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
    });
  }

  async getTaskById(id: string): Promise<Task | null> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      connection.db.get(`
        SELECT * FROM tasks WHERE id = ?
      `, [id], (err, task: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(task || null);
        }
      });
    });
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      // Build dynamic UPDATE query based on provided updates
      const fields = Object.keys(updates).filter(key => updates[key as keyof Task] !== undefined);
      if (fields.length === 0) {
        resolve(false);
        return;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof Task]);
      values.push(id);

      const stmt = connection.db.prepare(`
        UPDATE tasks SET ${setClause} WHERE id = ?
      `);

      stmt.run(values, function (err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteTask(id: string): Promise<boolean> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      // SQLite will handle CASCADE deletion of logs due to foreign key constraint
      const stmt = connection.db.prepare(`
        DELETE FROM tasks WHERE id = ?
      `);

      stmt.run([id], function (err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Task log operations
  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      connection.db.all(`
        SELECT * FROM task_logs 
        WHERE taskId = ? 
        ORDER BY timestamp ASC
      `, [taskId], (err, logs: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(logs || []);
        }
      });
    });
  }

  async addTaskLog(log: TaskLog): Promise<TaskLog> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const stmt = connection.db.prepare(`
        INSERT INTO task_logs (id, taskId, message, timestamp, isEditable)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        log.id,
        log.taskId,
        log.message,
        log.timestamp,
        log.isEditable
      ], function (err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(log);
        }
      });
    });
  }

  async updateTaskLog(logId: string, message: string): Promise<boolean> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const stmt = connection.db.prepare(`
        UPDATE task_logs SET message = ? WHERE id = ?
      `);

      stmt.run([message, logId], function (err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteTaskLog(logId: string): Promise<boolean> {
    const connection = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const stmt = connection.db.prepare(`
        DELETE FROM task_logs WHERE id = ?
      `);

      stmt.run([logId], function (err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
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

  async close() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
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