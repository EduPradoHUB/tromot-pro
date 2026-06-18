import React, { createContext, useContext } from 'react';
import { X } from 'lucide-react';

interface DialogCtx {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogCtx | null>(null);

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
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = ({ asChild, children }: CustomDialogTriggerProps) => {
  const ctx = useContext(DialogContext);
  const handleClick = (e: React.MouseEvent) => {
    ctx?.onOpenChange(true);
    const childOnClick = (children as any)?.props?.onClick;
    if (typeof childOnClick === 'function') childOnClick(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: handleClick });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
};

export const DialogContent = ({ className, children }: CustomDialogContentProps) => {
  const ctx = useContext(DialogContext);
  if (!ctx?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative z-50 mx-4 w-full max-w-2xl">
        <div className={`bg-background rounded-2xl shadow-lg border max-h-[80vh] overflow-y-auto ${className || ''}`}>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => ctx.onOpenChange(false)}
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/80 text-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DialogHeader = ({ children }: CustomDialogHeaderProps) => {
  return <div className="mb-4">{children}</div>;
};

export const DialogTitle = ({ children }: CustomDialogTitleProps) => {
  return <h2 className="text-lg font-semibold">{children}</h2>;
};