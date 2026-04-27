import { useToast } from '../../context/ToastContext'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function ToastArea() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 w-full p-4 rounded-xl shadow-modal text-sm font-medium animate-slide-up ${
            toast.type === 'success' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
            toast.type === 'error' ? 'bg-[#FFEBEE] text-[#C62828]' :
            'bg-fydly-100 text-fydly-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
          
          <span className="flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
