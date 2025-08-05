-- Drop existing tables if they exist (to ensure clean schema)
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in-progress', 'completed')),
  starttime TEXT NOT NULL,
  scheduledstarttime TEXT,
  scheduledendtime TEXT,
  completedtime TEXT,
  elapsedtime INTEGER NOT NULL DEFAULT 0
);

-- Create task_logs table
CREATE TABLE IF NOT EXISTS task_logs (
  id TEXT PRIMARY KEY,
  taskid TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  iseditable INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (taskid) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_logs_taskid ON task_logs(taskid);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_starttime ON tasks(starttime);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Enable Row Level Security (optional - you can disable if not needed)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_logs" ON task_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true);