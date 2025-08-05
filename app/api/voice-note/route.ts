import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AudioProcessingRequest } from '@/types/audio';

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export interface VoiceNoteResponse {
  success: boolean;
  title?: string;
  description?: string;
  originalTranscription?: string;
  error?: string;
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { audioData, mimeType }: AudioProcessingRequest = await request.json();

    if (!audioData) {
      return NextResponse.json({
        success: false,
        error: 'Audio data is required'
      } as VoiceNoteResponse, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key not configured'
      } as VoiceNoteResponse, { status: 500 });
    }

    // Validate MIME type
    const supportedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/ogg'];
    const cleanMimeType = mimeType.split(';')[0]; // Remove codec info
    
    if (!supportedTypes.includes(cleanMimeType)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported audio format: ${cleanMimeType}`
      } as VoiceNoteResponse, { status: 400 });
    }

    // Prepare content for Gemini - specialized for note creation
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: `Please transcribe this audio exactly as spoken and create an appropriate title for it as a note.

The user is creating a note, so please:
1. Transcribe exactly what they said without any changes or corrections
2. Generate a concise, descriptive title (3-8 words) that captures the main topic or theme
3. The title should be clear and help identify the note later

Respond in this exact format:
TITLE: [generated title]
TRANSCRIPTION: [exact words spoken, no changes]`
          },
          {
            inlineData: {
              mimeType: cleanMimeType,
              data: audioData
            }
          }
        ]
      }
    ];

    // Call Gemini for audio processing
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents,
      config: {
        temperature: 0.1, // Low temperature for accurate transcription
        maxOutputTokens: 10000
      }
    });

    const responseText = response.text || '';
    
    // Parse the structured response
    const titleMatch = responseText.match(/TITLE:\s*(.+?)(?=\nTRANSCRIPTION:|$)/s);
    const transcriptionMatch = responseText.match(/TRANSCRIPTION:\s*(.+?)$/s);

    const title = titleMatch?.[1]?.trim() || 'Voice Note';
    const transcription = transcriptionMatch?.[1]?.trim() || responseText;

    // Fallback title generation if parsing failed
    let finalTitle = title;
    if (title === 'Voice Note' && transcription) {
      // Generate a simple title from first few words
      const words = transcription.split(' ').slice(0, 6);
      finalTitle = words.join(' ');
      if (finalTitle.length > 50) {
        finalTitle = finalTitle.substring(0, 47) + '...';
      }
    }

    return NextResponse.json({
      success: true,
      title: finalTitle,
      description: transcription,
      originalTranscription: transcription
    } as VoiceNoteResponse);

  } catch (error) {
    console.error('Error in voice note processing API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process voice note',
      details: errorMessage
    } as VoiceNoteResponse, { status: 500 });
  }
}