import { Type } from '@google/genai';

// Concise function declarations for task management
export const taskFunctions = [
  {
    name: 'create_task',
    description: 'Create a new task when user mentions "I need to", "I should", or similar intent. Parse natural language times.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Actionable task title'
        },
        description: {
          type: Type.STRING,
          description: 'Task details and context'
        },
        scheduledStartTime: {
          type: Type.STRING,
          description: 'ISO date string for start time (parse natural language)'
        },
        scheduledEndTime: {
          type: Type.STRING,
          description: 'ISO date string for end time if specified'
        }
      },
      required: ['title', 'description']
    }
  },
  {
    name: 'get_tasks',
    description: 'Retrieve tasks for context. Call first when user asks about tasks or productivity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ['scheduled', 'in-progress', 'completed'],
          description: 'Filter by status. Leave empty for all tasks.'
        }
      },
      required: []
    }
  },
  {
    name: 'start_task',
    description: 'Start a scheduled task when user says "I\'m starting", "Let me work on", or similar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'ID of task to start (get from get_tasks first)'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark task as completed when user says "done", "finished", or similar completion language.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'ID of task to complete (get from get_tasks first)'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'delete_task',
    description: 'Delete a task when user says "delete", "remove", or similar removal language.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'ID of task to delete (get from get_tasks first)'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'add_task_log',
    description: 'Add progress note when user says "I made progress", "I\'m stuck", or "log this".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'ID of task to add log to (get from get_tasks first)'
        },
        message: {
          type: Type.STRING,
          description: 'Progress update or note'
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
