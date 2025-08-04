export interface AudioProcessingRequest {
  audioData: string; // Base64 encoded audio
  mimeType: string;
}

export interface AudioProcessingResponse {
  success: boolean;
  transcription?: string;
  intent?: string;
  confidence?: number;
  error?: string;
}

export interface AudioMetadata {
  transcription: string;
  duration: number;
  originalAudio?: boolean;
}