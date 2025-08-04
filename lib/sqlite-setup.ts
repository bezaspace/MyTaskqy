import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export interface DatabaseConnection {
  db: sqlite3.Database;
  close: () => Promise<void>;
}

// Get database path from environment or default
const getDatabasePath = (): string => {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'tasks.db');
};

// Initialize SQLite database with schema
export const initializeSQLiteDatabase = (): Promise<DatabaseConnection> => {
  return new Promise((resolve, reject) => {
    const dbPath = getDatabasePath();
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create tables if they don't exist
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('scheduled', 'in-progress', 'completed')),
          startTime TEXT NOT NULL,
          scheduledStartTime TEXT,
          scheduledEndTime TEXT,
          completedTime TEXT,
          elapsedTime INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS task_logs (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          isEditable INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_task_logs_taskId ON task_logs(taskId);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_startTime ON tasks(startTime);
      `;

      db.exec(createTablesSQL, (err) => {
        if (err) {
          reject(err);
          return;
        }

        const connection: DatabaseConnection = {
          db,
          close: () => {
            return new Promise((resolveClose, rejectClose) => {
              db.close((err) => {
                if (err) rejectClose(err);
                else resolveClose();
              });
            });
          }
        };

        resolve(connection);
      });
    });
  });
};

// Migration function to import existing JSON data
export const migrateFromJSON = async (connection: DatabaseConnection): Promise<void> => {
  const jsonPath = path.join(process.cwd(), 'tasks.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('No existing tasks.json found, starting with empty database');
    return;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const { tasks = [], task_logs = [] } = jsonData;

    console.log(`Migrating ${tasks.length} tasks and ${task_logs.length} logs from JSON to SQLite...`);

    // Begin transaction
    await new Promise<void>((resolve, reject) => {
      connection.db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // Insert tasks
      const insertTaskStmt = connection.db.prepare(`
        INSERT OR REPLACE INTO tasks 
        (id, title, description, status, startTime, scheduledStartTime, scheduledEndTime, completedTime, elapsedTime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const task of tasks) {
        await new Promise<void>((resolve, reject) => {
          insertTaskStmt.run([
            task.id,
            task.title,
            task.description,
            task.status,
            task.startTime,
            task.scheduledStartTime || null,
            task.scheduledEndTime || null,
            task.completedTime || null,
            task.elapsedTime || 0
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      insertTaskStmt.finalize();

      // Insert task logs
      const insertLogStmt = connection.db.prepare(`
        INSERT OR REPLACE INTO task_logs 
        (id, taskId, message, timestamp, isEditable)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const log of task_logs) {
        await new Promise<void>((resolve, reject) => {
          insertLogStmt.run([
            log.id,
            log.taskId,
            log.message,
            log.timestamp,
            log.isEditable || 1
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      insertLogStmt.finalize();

      // Commit transaction
      await new Promise<void>((resolve, reject) => {
        connection.db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Backup the JSON file
      const backupPath = path.join(process.cwd(), 'tasks.json.backup');
      fs.renameSync(jsonPath, backupPath);
      
      console.log(`Migration completed successfully! Original file backed up as tasks.json.backup`);

    } catch (error) {
      // Rollback on error
      await new Promise<void>((resolve) => {
        connection.db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};