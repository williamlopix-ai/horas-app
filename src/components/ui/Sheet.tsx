import { type ReactNode, useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export type TamanhoSheet = 'sm' | 'md' | 'lg'

export interface SheetProps {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  rodape?: ReactNode
  tamanho?: TamanhoSheet
  className?: string
}

export function Sheet({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  rodape,
  tamanho = 'md',
  className = '',
}: SheetProps) {
  const titleId = useId()
  const painelRef = useRef<HTMLDivElement>(null)
  const aoFecharRef = useRef(aoFechar)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  })

  // efeito 1 — trava de scroll e foco inicial
  useEffect(() => {
    if (!aberto) return
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painelRef.current?.focus()
    return () => {
      document.body.style.overflow = overflowOriginal
    }
  }, [aberto])

  // efeito 2 — tecla Escape
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFecharRef.current()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  if (!aberto) return null

  const tamanhoClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[tamanho]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--scrim)' }}
      onClick={aoFechar}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${tamanhoClasses} bg-surface-2 rounded-sheet shadow-e3 border border-hair flex flex-col max-h-[85vh] outline-none ${className}`}
      >
        <div className="flex items-start justify-between p-5 border-b border-hair shrink-0">
          <div className="space-y-1">
            <h2 id={titleId} className="font-display font-semibold text-base text-ink-900">
              {titulo}
            </h2>
            {descricao && <p className="text-[13px] text-ink-500">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="text-ink-500 hover:text-ink-900 p-1 rounded-ctl hover:bg-surface-3 transition-colors duration-d1 ease-ez -mr-1 -mt-1"
          >
            <X className="w-icon-sm h-icon-sm" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {rodape && (
          <div
            className="p-4 border-t border-hair flex justify-end gap-2 shrink-0"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
