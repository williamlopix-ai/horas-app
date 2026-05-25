import { useEffect, useState } from 'react'
import { getErrorMessage } from '../utils/errors'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-[#0B0E14]/50">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Horário do Dia</h2>
            <p className="text-xs text-gray-400 capitalize">{dataFormatada}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors focus:outline-none"
            title="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Início
                </label>
                <input
                  type="time"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-2.5 h-11 text-white text-sm focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all font-mono"
                  required
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Fim
                </label>
                <input
                  type="time"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-2.5 h-11 text-white text-sm focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all font-mono"
                  required
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Definir um horário diferente atualizará os cálculos de tempo vago (gaps) apenas para este dia específico.
            </p>

          </div>

          {/* Rodapé (Ações) */}
          <div className="px-6 py-4 border-t border-gray-800 bg-[#0B0E14]/50 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03A9F4]/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
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
