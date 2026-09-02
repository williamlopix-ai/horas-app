import { useEffect, useState, useRef, useId } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { getErrorMessage } from '../utils/errors'
import { useModal } from '../hooks/useModal'

interface ModalHorarioDiaProps {
  isOpen: boolean
  onClose: () => void
  onSave: (inicio: string, fim: string) => Promise<void>
  dataSelecionada: string // YYYY-MM-DD
  inicioAtual: string
  fimAtual: string
}

export default function ModalHorarioDia({
  isOpen,
  onClose,
  onSave,
  dataSelecionada,
  inicioAtual,
  fimAtual
}: ModalHorarioDiaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tituloId = useId()
  const [inicio, setInicio] = useState(inicioAtual)
  const [fim, setFim] = useState(fimAtual)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setInicio(inicioAtual)
      setFim(fimAtual)
      setError(null)
      setSaving(false)
    }
  }, [isOpen, inicioAtual, fimAtual])

  useModal(isOpen, containerRef, onClose)

  if (!isOpen) return null

  // Format Date for display
  const [y, m, d] = dataSelecionada.split('-').map(Number)
  const dataFormatada = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inicio || !fim) {
      setError('Preencha os horários de início e fim.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await onSave(inicio, fim)
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar horário do dia:', err)
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-d3"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="bg-surface-1 border border-hair-strong rounded-sheet w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-d3"
      >

        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-hair-strong flex items-center justify-between bg-surface-0/50">
          <div>
            <h2 id={tituloId} className="text-lg font-bold text-ink-900 tracking-tight">Horário do Dia</h2>
            <p className="text-xs text-ink-500 capitalize">{dataFormatada}</p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-surface-3 rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none"
            title="Fechar"
          >
            <X className="w-icon-md h-icon-md" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">

            {error && (
              <div
                style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
                className="p-3 bg-bad-bg border rounded-card text-bad text-xs flex items-start gap-sm"
              >
                <AlertTriangle className="w-icon-sm h-icon-sm shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-lg">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                  Início
                </label>
                <input
                  type="time"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="w-full bg-surface-0 border border-hair-strong rounded-ctl px-4 py-2.5 h-11 text-ink-900 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez font-mono"
                  required
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                  Fim
                </label>
                <input
                  type="time"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="w-full bg-surface-0 border border-hair-strong rounded-ctl px-4 py-2.5 h-11 text-ink-900 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez font-mono"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-ink-500 italic">
              Definir um horário diferente atualizará os cálculos de tempo vago (gaps) apenas para este dia específico.
            </p>

          </div>

          {/* Rodapé (Ações) */}
          <div className="px-6 py-4 border-t border-hair-strong bg-surface-0/50 flex justify-end gap-md mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 text-sm font-semibold text-ink-700 hover:text-ink-900 hover:bg-surface-3 rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-pri text-pri-fg text-sm font-bold rounded-ctl transition-colors duration-d1 ease-ez shadow-e1 hover:bg-pri-hover active:translate-y-[0.5px] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin w-icon-sm h-icon-sm" />
                  Salvando…
                </>
              ) : (
                'Salvar Horário'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
