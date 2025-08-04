/**
 * Convert audio blob to base64 string for API transmission
 */
export async function audioToBase64(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:audio/webm;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Validate audio file size (Gemini has 20MB limit)
 */
export function validateAudioSize(audioBlob: Blob): boolean {
  const maxSize = 20 * 1024 * 1024; // 20MB in bytes
  return audioBlob.size <= maxSize;
}

/**
 * Get supported MIME type for audio recording
 */
export function getSupportedAudioMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'audio/webm'; // Fallback
}

/**
 * Convert webm to wav if needed (for better Gemini compatibility)
 */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  // For now, return as-is. In production, you might want to use
  // a library like lamejs or ffmpeg.wasm for conversion
  return audioBlob;
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}