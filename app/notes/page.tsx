"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Plus, StickyNote, ArrowLeft, Menu, Mic } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NoteCard, Note } from '@/components/NoteCard';
import { CreateNoteDialog } from '@/components/CreateNoteDialog';
import { NoteViewModal } from '@/components/NoteViewModal';
import { VoiceInput } from '@/components/VoiceInput';
import { VoiceNoteInput, VoiceNoteResult } from '@/components/VoiceNoteInput';

// API helper functions
async function fetchNotes(): Promise<Note[]> {
  const response = await fetch('/api/notes');
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

async function createNoteAPI(title: string, description: string): Promise<void> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function updateNoteAPI(noteId: string, title: string, description: string): Promise<void> {
  const response = await fetch(`/api/notes?id=${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

async function deleteNoteAPI(noteId: string): Promise<void> {
  const response = await fetch(`/api/notes?id=${noteId}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
}

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [voiceNoteData, setVoiceNoteData] = useState<VoiceNoteResult | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await fetchNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (title: string, description: string) => {
    try {
      await createNoteAPI(title, description);
      await loadNotes(); // Refresh notes
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  };

  const updateNote = async (noteId: string, title: string, description: string) => {
    try {
      await updateNoteAPI(noteId, title, description);
      await loadNotes(); // Refresh notes
      setEditNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await deleteNoteAPI(noteId);
      await loadNotes(); // Refresh notes
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditNote(note);
    setIsCreateDialogOpen(true);
  };

  const handleViewNote = (note: Note) => {
    setViewNote(note);
    setIsViewModalOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditNote(null);
    setVoiceNoteData(null);
  };

  const handleVoiceNote = (result: VoiceNoteResult) => {
    // Set the voice note data and open the dialog for user confirmation
    setVoiceNoteData(result);
    setIsCreateDialogOpen(true);
  };

  const handleQuickVoiceNote = async (transcription: string) => {
    // Keep the old quick voice note functionality for other voice inputs
    if (transcription && transcription.trim()) {
      const text = transcription.trim();
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());

      let title = '';
      let description = '';

      if (sentences.length === 1 || text.length <= 50) {
        title = text;
      } else {
        title = sentences[0].trim();
        description = sentences.slice(1).join('. ').trim();
        if (description && !description.endsWith('.')) {
          description += '.';
        }
      }

      try {
        await createNote(title, description);
      } catch (error) {
        console.error('Failed to create voice note:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <StickyNote className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-400">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-zinc-800 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-yellow-400 flex items-center gap-3">
                <StickyNote className="w-8 h-8 md:w-10 md:h-10" />
                Notes
              </h1>
              <p className="text-gray-400 text-sm md:text-base mt-1">
                Keep track of your thoughts and ideas
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-3 items-center">
            <VoiceNoteInput
              onVoiceNote={handleVoiceNote}
              disabled={loading}
            />
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
            {session?.user && (
              <Button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                variant="outline"
                className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black font-semibold"
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex gap-2">
            <VoiceNoteInput
              onVoiceNote={handleVoiceNote}
              disabled={loading}
            />
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 md:mb-8">
          <Card className="bg-zinc-900 border-zinc-800 inline-block">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <StickyNote className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Notes</p>
                  <p className="text-2xl font-bold text-white">{notes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Grid */}
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={deleteNote}
                onView={handleViewNote}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <StickyNote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No notes yet</h3>
            <p className="text-gray-500 mb-6">Create your first note to start organizing your thoughts</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <div className="flex justify-center">
                <VoiceNoteInput
                  onVoiceNote={handleVoiceNote}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Note
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Note Dialog */}
        <CreateNoteDialog
          open={isCreateDialogOpen}
          onOpenChange={handleCloseDialog}
          onCreateNote={createNote}
          onUpdateNote={updateNote}
          editNote={editNote || (voiceNoteData ? {
            id: '',
            title: voiceNoteData.title,
            description: voiceNoteData.description,
            created_at: ''
          } : null)}
        />

        {/* Note View Modal */}
        <NoteViewModal
          note={viewNote}
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          onEdit={handleEditNote}
          onDelete={deleteNote}
        />
      </div>
    </div>
  );
}