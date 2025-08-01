import { Type } from '@google/genai';

// Function declarations for Gemini AI to understand available task operations
export const taskFunctions = [
  {
    name: 'create_task',
    description: 'Creates a new task with title and description. Can optionally schedule it for later.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'The title of the task'
        },
        description: {
          type: Type.STRING,
          description: 'Detailed description of the task'
        },
        scheduledStartTime: {
          type: Type.STRING,
          description: 'Optional ISO date string for when the task should start (e.g., "2024-01-15T14:00:00.000Z")'
        },
        scheduledEndTime: {
          type: Type.STRING,
          description: 'Optional ISO date string for when the task should end (e.g., "2024-01-15T16:00:00.000Z")'
        }
      },
      required: ['title', 'description']
    }
  },
  {
    name: 'get_tasks',
    description: 'Retrieves tasks based on status filter. Returns all tasks if no status specified.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ['scheduled', 'in-progress', 'completed'],
          description: 'Filter tasks by status. Leave empty to get all tasks.'
        }
      },
      required: []
    }
  },
  {
    name: 'start_task',
    description: 'Starts a scheduled task, changing its status to in-progress.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'The ID of the task to start'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'complete_task',
    description: 'Marks a task as completed.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'The ID of the task to complete'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'delete_task',
    description: 'Permanently deletes a task and all its logs.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'The ID of the task to delete'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'add_task_log',
    description: 'Adds a log entry to an existing task.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'The ID of the task to add log to'
        },
        message: {
          type: Type.STRING,
          description: 'The log message to add'
        }
      },
      required: ['taskId', 'message']
    }
  }
];

// Helper function to execute task operations
export async function executeTaskFunction(functionName: string, args: any) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:3000';

  switch (functionName) {
    case 'create_task':
      const createResponse = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await createResponse.json();

    case 'get_tasks':
      const getResponse = await fetch(`${baseUrl}/api/tasks`);
      const tasksResult = await getResponse.json();
      
      if (args.status && tasksResult.success) {
        const filteredTasks = tasksResult.data.filter((task: any) => task.status === args.status);
        return { success: true, data: filteredTasks };
      }
      return tasksResult;

    case 'start_task':
      const startResponse = await fetch(`${baseUrl}/api/tasks?action=start&id=${args.taskId}`, {
        method: 'POST'
      });
      return await startResponse.json();

    case 'complete_task':
      const completeResponse = await fetch(`${baseUrl}/api/tasks?action=complete&id=${args.taskId}`, {
        method: 'POST'
      });
      return await completeResponse.json();

    case 'delete_task':
      const deleteResponse = await fetch(`${baseUrl}/api/tasks?id=${args.taskId}`, {
        method: 'DELETE'
      });
      return await deleteResponse.json();

    case 'add_task_log':
      const logResponse = await fetch(`${baseUrl}/api/tasks?action=addLog&id=${args.taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: args.message })
      });
      return await logResponse.json();

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}