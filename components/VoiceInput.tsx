"use client";

import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { audioToBase64, validateAudioSize, formatDuration } from '@/lib/audio-utils';
import { AudioProcessingResponse } from '@/types/audio';

interface VoiceInputProps {
  onTranscription: (transcription: string, audioMetadata: any) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscription, disabled }: VoiceInputProps) {
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
        return;
      }

      // Convert to base64
      const base64Audio = await audioToBase64(audioBlob);
      
      // Send to audio processing API
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type
        })
      });

      const result: AudioProcessingResponse = await response.json();

      if (result.success && result.transcription) {
        // Pass transcription back to parent with metadata
        onTranscription(result.transcription, {
          transcription: result.transcription,
          duration: duration,
          originalAudio: true
        });
      } else {
        console.error('Audio processing failed:', result.error);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
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
      
      {/* Voice input button */}
      <Button
        type="button"
        size="sm"
        variant={isRecording ? "destructive" : "ghost"}
        className={`p-2 h-9 w-9 flex-shrink-0 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'hover:bg-zinc-700'
        }`}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isLoading}
        title={isRecording ? 'Stop recording' : 'Start voice recording'}
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