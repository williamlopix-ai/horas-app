import { useRef, useId } from 'react'
import { X } from 'lucide-react'
import { useModal } from '../../hooks/useModal'
import ColunaDia from './ColunaDia'
import { HORA_INICIO, HORAS_DA_GRADE, ALTURA_HORA, ALTURA_GRADE, type RegistroComProjeto } from './grade'

interface ModalDiaUnicoProps {
  isOpen: boolean
  onClose: () => void
  data: Date
  registros: RegistroComProjeto[]
  agoraTop?: number
}

export default function ModalDiaUnico({ isOpen, onClose, data, registros, agoraTop }: ModalDiaUnicoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tituloId = useId()

  useModal(isOpen, containerRef, onClose)

  if (!isOpen) return null

  const dataFormatada = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-d3"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="bg-surface-1 border border-hair-strong rounded-sheet w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-d3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-hair-strong flex items-center justify-between bg-surface-0/50">
          <h2 id={tituloId} className="text-lg font-bold text-ink-900 tracking-tight capitalize">
            {dataFormatada}
          </h2>
          <button
            onClick={onClose}
            data-foco-inicial
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-surface-3 rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none"
            title="Fechar"
          >
            <X className="w-icon-md h-icon-md" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div className="grid" style={{ gridTemplateColumns: '52px 1fr' }}>
            <div className="relative" style={{ height: ALTURA_GRADE }}>
              {HORAS_DA_GRADE.map(h => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-500 tabular-nums"
                  style={{ top: (h - HORA_INICIO) * ALTURA_HORA }}
                >
                  {String(h).padStart(2, '0')}h
                </div>
              ))}
            </div>
            <ColunaDia registros={registros} agoraTop={agoraTop} />
          </div>
        </div>
      </div>
    </div>
  )
}
