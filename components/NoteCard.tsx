"use client";

import { useState } from 'react';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface Note {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsDeleting(true);
      try {
        await onDelete(note.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-white line-clamp-2">
            {note.title}
          </CardTitle>
          <div className="flex gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(note.created_at)}</span>
        </div>
      </CardHeader>
      
      {note.description && (
        <CardContent className="pt-0">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
            {note.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}