"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage } from '@/components/ChatMessage';
import { VoiceInput } from '@/components/VoiceInput';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioMetadata?: {
    transcription: string;
    duration: number;
    originalAudio?: boolean;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI task assistant. I can help you create, manage, and track your tasks through natural conversation.\n\nTry saying things like:\n• "Create a task to review the quarterly report"\n• "Show me all my active tasks"\n• "Complete the task about reviewing code"\n• "Schedule a meeting for tomorrow at 2 PM"',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageContent?: string, audioMetadata?: any) => {
    const content = messageContent || inputMessage.trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      audioMetadata
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages,
          audioMetadata: userMessage.audioMetadata
        })
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${result.error}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceTranscription = (transcription: string, audioMetadata: any) => {
    sendMessage(transcription, audioMetadata);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 md:px-3">
                <ArrowLeft className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Back to Tasks</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">AI Assistant</h1>
                <p className="text-xs md:text-sm text-gray-400 hidden sm:block">Manage your tasks with natural language</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-4 md:py-6 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto mb-3 md:mb-4">
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-black" />
                  </div>
                  <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI is thinking...
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-800 pt-3 md:pt-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 md:gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me to create, manage, or track your tasks..."
                  className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder-gray-400 focus:border-yellow-400 text-sm md:text-base"
                  disabled={isLoading}
                />
                <VoiceInput 
                  onTranscription={handleVoiceTranscription}
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 md:px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center px-2">
                <span className="hidden md:inline">Try: "Create a task to review code" • "Show my active tasks" • "Complete task #123"</span>
                <span className="md:hidden">Try: "Create a task" • "Show active tasks"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}