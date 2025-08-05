"use client";

import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { audioToBase64, validateAudioSize, formatDuration } from '@/lib/audio-utils';

export interface VoiceNoteResult {
  title: string;
  description: string;
  originalTranscription: string;
}

interface VoiceNoteInputProps {
  onVoiceNote: (result: VoiceNoteResult) => void;
  disabled?: boolean;
}

export function VoiceNoteInput({ onVoiceNote, disabled }: VoiceNoteInputProps) {
  const { recordingState, startRecording, stopRecording, error, duration } = useAudioRecording();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const audioBlob = await stopRecording();
      
      if (!audioBlob) {
        console.error('No audio recorded');
        return;
      }

      // Validate file size
      if (!validateAudioSize(audioBlob)) {
        console.error('Audio file too large (max 20MB)');
        alert('Audio recording too large. Please try a shorter recording.');
        return;
      }

      // Convert to base64
      const base64Audio = await audioToBase64(audioBlob);
      
      // Send to voice note processing API
      const response = await fetch('/api/voice-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type
        })
      });

      const result = await response.json();

      if (result.success && result.title && result.description) {
        // Pass the structured note data back to parent
        onVoiceNote({
          title: result.title,
          description: result.description,
          originalTranscription: result.originalTranscription || result.description
        });
      } else {
        console.error('Voice note processing failed:', result.error);
        alert('Failed to process voice note. Please try again.');
      }

    } catch (error) {
      console.error('Error processing voice note:', error);
      alert('Failed to process voice note. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isRecording = recordingState === 'recording';
  const isLoading = recordingState === 'processing' || isProcessing;
  const hasError = recordingState === 'error' || error;

  return (
    <div className="flex items-center gap-2">
      {/* Recording duration display */}
      {isRecording && (
        <div className="text-xs text-yellow-400 font-mono hidden sm:block">
          {formatDuration(duration)}
        </div>
      )}
      
      {/* Voice note button */}
      <Button
        type="button"
        size="sm"
        variant={isRecording ? "destructive" : "outline"}
        className={`p-2 h-9 w-9 flex-shrink-0 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse border-red-500' 
            : 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
        }`}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isLoading}
        title={isRecording ? 'Stop recording voice note' : 'Record voice note'}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-3 h-3 md:w-4 md:h-4" />
        ) : (
          <Mic className="w-3 h-3 md:w-4 md:h-4" />
        )}
      </Button>

      {/* Error display */}
      {hasError && (
        <div className="text-xs text-red-400 max-w-20 md:max-w-32 truncate" title={error || 'Recording error'}>
          {error || 'Recording error'}
        </div>
      )}
    </div>
  );
}