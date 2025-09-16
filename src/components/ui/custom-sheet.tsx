import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface CustomSheetContentProps {
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  style?: React.CSSProperties;
  'data-sidebar'?: string;
  'data-mobile'?: string;
  children: React.ReactNode;
}

interface CustomSheetHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomSheetTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomSheetDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomSheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const Sheet = ({ open, onOpenChange, children }: CustomSheetProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/80" 
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
};

export const SheetContent = ({ className, side = 'right', style, children, ...props }: CustomSheetContentProps) => {
  const sideClasses = {
    top: 'top-0 left-0 right-0 border-b',
    right: 'right-0 top-0 bottom-0 border-l',
    bottom: 'bottom-0 left-0 right-0 border-t',
    left: 'left-0 top-0 bottom-0 border-r'
  };

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background p-6 shadow-lg transition ease-in-out",
        sideClasses[side],
        side === 'top' || side === 'bottom' ? 'h-auto' : 'w-3/4 sm:max-w-sm',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export const SheetHeader = ({ className, children }: CustomSheetHeaderProps) => {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
      {children}
    </div>
  );
};

export const SheetTitle = ({ className, children }: CustomSheetTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
};

export const SheetDescription = ({ className, children }: CustomSheetDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export const SheetTrigger = ({ asChild, children }: CustomSheetTriggerProps) => {
  return <>{children}</>;
};

export const SheetClose = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};