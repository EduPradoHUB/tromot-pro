import React, { createContext, useContext, useState, forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface CustomDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface CustomDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: CustomDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ className, children }: CustomDialogContentProps) => {
  return (
    <div className={cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
      className
    )}>
      {children}
    </div>
  );
};

export const DialogHeader = ({ className, children }: CustomDialogHeaderProps) => {
  return (
    <div className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}>
      {children}
    </div>
  );
};

export const DialogTitle = ({ className, children }: CustomDialogTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  );
};

export const DialogDescription = ({ className, children }: CustomDialogDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export const DialogTrigger = ({ asChild, children }: CustomDialogTriggerProps) => {
  return <>{children}</>;
};

export const DialogFooter = ({ className, children }: CustomDialogFooterProps) => {
  return (
    <div className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}>
      {children}
    </div>
  );
};

export const DialogClose = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const DialogPortal = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const DialogOverlay = ({ className }: { className?: string }) => {
  return <div className={cn("fixed inset-0 z-50 bg-black/80", className)} />;
};
