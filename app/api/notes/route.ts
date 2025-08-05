import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getAllNotes, createNote, updateNote, deleteNote } from '@/lib/database';

// Initialize database on module load
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
};

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const notes = await getAllNotes();
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const note = await createNote({
      title,
      description: description || ''
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const url = new URL(request.url);
    const noteId = url.searchParams.get('id');

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const note = await updateNote(noteId, body);
    
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const url = new URL(request.url);
    const noteId = url.searchParams.get('id');

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteNote(noteId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}