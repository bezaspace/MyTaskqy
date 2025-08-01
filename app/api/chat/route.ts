import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { taskFunctions, executeTaskFunction } from '@/lib/gemini-functions';

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Prepare conversation contents
    const contents = [
      {
        role: 'user' as const,
        parts: [{
          text: `You are a helpful AI assistant for a task management application. You can help users create, manage, and track their tasks through natural conversation.

Available functions:
- create_task: Create new tasks with optional scheduling
- get_tasks: Retrieve tasks (all or filtered by status)
- start_task: Start a scheduled task
- complete_task: Mark a task as completed
- delete_task: Delete a task permanently
- add_task_log: Add notes/logs to existing tasks

When users ask about tasks, be conversational and helpful. Format task information clearly and provide useful summaries.

Current user message: ${message}`
        }]
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      // Add previous messages to context (limit to last 10 for performance)
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
      
      // Add current message
      contents.push({
        role: 'user' as const,
        parts: [{ text: message }]
      });
    }

    // Configure function calling
    const config = {
      tools: [{
        functionDeclarations: taskFunctions
      }],
      temperature: 0.7,
      maxOutputTokens: 1000
    };

    // Send request to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config
    });

    // Check if Gemini wants to call functions
    if (response.functionCalls && response.functionCalls.length > 0) {
      let finalResponse = '';
      const functionResults = [];

      // Execute all function calls
      for (const functionCall of response.functionCalls) {
        try {
          const result = await executeTaskFunction(functionCall.name, functionCall.args);
          functionResults.push({
            name: functionCall.name,
            result: result
          });
        } catch (error) {
          console.error(`Error executing function ${functionCall.name}:`, error);
          functionResults.push({
            name: functionCall.name,
            result: { success: false, error: error.message }
          });
        }
      }

      // Send function results back to Gemini for a natural response
      const followUpContents = [
        ...contents,
        {
          role: 'model' as const,
          parts: response.functionCalls.map(fc => ({ functionCall: fc }))
        },
        {
          role: 'user' as const,
          parts: functionResults.map(result => ({
            functionResponse: {
              name: result.name,
              response: { result: result.result }
            }
          }))
        }
      ];

      const finalResponseFromAI = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: followUpContents,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      });

      finalResponse = finalResponseFromAI.text || 'Task operation completed successfully.';

      return NextResponse.json({
        success: true,
        response: finalResponse,
        functionCalls: response.functionCalls,
        functionResults
      });
    }

    // No function calls, return direct response
    return NextResponse.json({
      success: true,
      response: response.text || 'I understand. How can I help you with your tasks?'
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process chat request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}