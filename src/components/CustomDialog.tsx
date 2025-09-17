import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface CustomDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogHeaderProps {
  children: React.ReactNode;
}

interface CustomDialogTitleProps {
  children: React.ReactNode;
}

interface CustomDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: CustomDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ className, children }: CustomDialogContentProps) => {
  return (
    <div className={`bg-background rounded-2xl shadow-lg border max-w-2xl max-h-[80vh] overflow-y-auto mx-4 w-full ${className || ''}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ children }: CustomDialogHeaderProps) => {
  return (
    <div className="mb-4">
      {children}
    </div>
  );
};

export const DialogTitle = ({ children }: CustomDialogTitleProps) => {
  return (
    <h2 className="text-lg font-semibold">
      {children}
    </h2>
  );
};

export const DialogTrigger = ({ asChild, children }: CustomDialogTriggerProps) => {
  // For simplicity, just return the children as-is
  return <>{children}</>;
};