
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Check, X } from 'lucide-react';

interface EditTitleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  setTitle: (title: string) => void;
}

const EditTitleDialog: React.FC<EditTitleDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  setTitle,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Chat Title</AlertDialogTitle>
          <AlertDialogDescription>Enter a new title for this chat.</AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
          placeholder="New chat title"
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}><X className="h-4 w-4 mr-2" />Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}><Check className="h-4 w-4 mr-2" />Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditTitleDialog;
