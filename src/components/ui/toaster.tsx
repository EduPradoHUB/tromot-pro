import { useToast } from "@/hooks/use-toast"
import { Toast } from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toastData) => (
        <Toast
          key={toastData.id}
          title={toastData.title}
          description={toastData.description}
          variant={toastData.variant}
          onClose={() => dismiss(toastData.id)}
        />
      ))}
    </div>
  )
}
