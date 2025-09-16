import * as React from 'react';
import { cn } from '@/lib/utils';

interface CustomAlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface CustomAlertDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomAlertDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomAlertDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomAlertDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomAlertDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomAlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface CustomAlertDialogActionProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

interface CustomAlertDialogCancelProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const AlertDialog = ({ open, onOpenChange, children }: CustomAlertDialogProps) => {
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

export const AlertDialogContent = ({ className, children }: CustomAlertDialogContentProps) => {
  return (
    <div className={cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
      className
    )}>
      {children}
    </div>
  );
};

export const AlertDialogHeader = ({ className, children }: CustomAlertDialogHeaderProps) => {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
      {children}
    </div>
  );
};

export const AlertDialogTitle = ({ className, children }: CustomAlertDialogTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
};

export const AlertDialogDescription = ({ className, children }: CustomAlertDialogDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export const AlertDialogFooter = ({ className, children }: CustomAlertDialogFooterProps) => {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  );
};

export const AlertDialogTrigger = ({ asChild, children }: CustomAlertDialogTriggerProps) => {
  return <>{children}</>;
};

export const AlertDialogAction = ({ className, onClick, children }: CustomAlertDialogActionProps) => {
  return (
    <button 
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const AlertDialogCancel = ({ className, onClick, children }: CustomAlertDialogCancelProps) => {
  return (
    <button 
      className={cn("mt-2 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0", className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};