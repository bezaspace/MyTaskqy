"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VoiceInput } from '@/components/VoiceInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface Note {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNote: (title: string, description: string) => Promise<void>;
  onUpdateNote?: (noteId: string, title: string, description: string) => Promise<void>;
  editNote?: Note | null;
}

export function CreateNoteDialog({ 
  open, 
  onOpenChange, 
  onCreateNote, 
  onUpdateNote,
  editNote 
}: CreateNoteDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!editNote && !!editNote.id;

  useEffect(() => {
    if (editNote) {
      setTitle(editNote.title);
      setDescription(editNote.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [editNote, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (isEditing && editNote && editNote.id && onUpdateNote) {
        await onUpdateNote(editNote.id, title.trim(), description.trim());
      } else {
        await onCreateNote(title.trim(), description.trim());
      }
      
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400">
            {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEditing ? 'Edit Note' : 'Create New Note'}
            {!isEditing && editNote?.title && editNote?.description && !editNote?.id && (
              <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Voice Note
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditing 
              ? 'Update your note details below.' 
              : (!isEditing && editNote?.title && editNote?.description && !editNote?.id)
                ? 'Review and confirm your voice note below. You can edit the title and description before saving.'
                : 'Add a new note to keep track of your thoughts and ideas.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-300">
              Title *
            </Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-yellow-400 flex-1"
                disabled={loading}
                required
              />
              <VoiceInput
                onTranscription={(transcription) => {
                  if (transcription && transcription.trim()) {
                    setTitle(transcription.trim());
                  }
                }}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-300">
              Description
            </Label>
            <div className="space-y-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter note description..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-yellow-400 min-h-[100px] resize-none"
                disabled={loading}
              />
              <div className="flex justify-end">
                <VoiceInput
                  onTranscription={(transcription) => {
                    if (transcription && transcription.trim()) {
                      // Append to existing description with a space if there's already content
                      const newDescription = description 
                        ? `${description} ${transcription.trim()}`
                        : transcription.trim();
                      setDescription(newDescription);
                    }
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Note' : 'Create Note')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}