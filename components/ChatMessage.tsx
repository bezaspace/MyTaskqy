"use client";

import { Bot, User, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    audioMetadata?: {
      transcription: string;
      duration: number;
      originalAudio?: boolean;
    };
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Format timestamp consistently and avoid hydration mismatch
  const formatTimestamp = (date: Date) => {
    if (!isClient) {
      // Return a placeholder during SSR to avoid hydration mismatch
      return '';
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-black" />
        </div>
      )}
      
      <Card className={`max-w-[80%] ${
        isUser 
          ? 'bg-yellow-400 text-black border-yellow-400' 
          : 'bg-zinc-900 border-zinc-800 text-white'
      }`}>
        <CardContent className="p-3">
          {/* Audio indicator for voice messages */}
          {message.audioMetadata?.originalAudio && (
            <div className={`flex items-center gap-2 mb-2 text-xs ${
              isUser ? 'text-black/70' : 'text-gray-400'
            }`}>
              <Mic className="w-3 h-3" />
              <span>Voice message</span>
              {message.audioMetadata.duration && (
                <span>({Math.round(message.audioMetadata.duration)}s)</span>
              )}
            </div>
          )}
          
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          <div className={`text-xs mt-2 ${
            isUser ? 'text-black/70' : 'text-gray-400'
          }`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </CardContent>
      </Card>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}