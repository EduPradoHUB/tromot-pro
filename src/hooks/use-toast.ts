import * as React from "react"

interface ToastProps {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

let toastCallback: ((toast: ToastProps) => void) | null = null

export function toast(props: ToastProps) {
  if (toastCallback) {
    toastCallback(props)
  } else {
    // Fallback: show as alert if no provider is available
    const message = [props.title, props.description].filter(Boolean).join(': ')
    alert(message)
  }
}

export function useToast() {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([])

  React.useEffect(() => {
    toastCallback = (newToast: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9)
      const toastWithId = { ...newToast, id }
      
      setToasts(prev => [...prev, toastWithId])
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 5000)
    }

    return () => {
      toastCallback = null
    }
  }, [])

  const dismiss = (toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}