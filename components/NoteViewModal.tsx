"use client";

import { X, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface Note {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface NoteViewModalProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export function NoteViewModal({ 
  note, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete 
}: NoteViewModalProps) {
  if (!note) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const handleEdit = () => {
    onEdit(note);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-bold text-white mb-3 leading-tight">
                  {note.title}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {note.description ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                  {note.description}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No description provided</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}