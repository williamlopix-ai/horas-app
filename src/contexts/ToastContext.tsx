import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContainer } from '../components/Toast'
import type { ToastItem, ToastType } from '../components/Toast'

const MAX_TOASTS = 3

interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      // Limitar ao máximo de 3 toasts simultâneos (remove os mais antigos)
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return ctx
}
