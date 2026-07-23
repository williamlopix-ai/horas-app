import React, { useState, useEffect } from 'react'
import type { Projeto } from '../types'
import { getErrorMessage } from '../utils/errors'

interface ModalProjetoProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dados: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; horas_contratadas: number | null; status?: 'ativo' | 'encerrado' | 'excluido'; codigo_externo: string | null; billable: boolean }) => Promise<void>
  projeto?: Projeto | null
  temFases?: boolean
}

const PALETA_CORES = [
  '#03A9F4',
  '#4CAF50',
  '#F44336',
  '#FF9800',
  '#9C27B0',
  '#00BCD4',
  '#FF5722',
  '#607D8B'
]

export default function ModalProjeto({ isOpen, onClose, onSave, projeto, temFases }: ModalProjetoProps) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(PALETA_CORES[0])
  const [status, setStatus] = useState<'ativo' | 'encerrado' | 'excluido'>('ativo')
  const [tipo, setTipo] = useState<'projeto' | 'rotina'>('projeto')
  const [horasContratadas, setHorasContratadas] = useState<string>('')
  const [codigoExterno, setCodigoExterno] = useState<string>('')
  const [billable, setBillable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Atualizar os estados internos do formulário quando o modal abre ou o projeto muda
  useEffect(() => {
    if (isOpen) {
      if (projeto) {
        setNome(projeto.nome)
        setCor(projeto.cor)
        setStatus(projeto.status)
        setTipo(projeto.tipo || 'projeto')
        setHorasContratadas(projeto.horas_contratadas !== null && projeto.horas_contratadas !== undefined ? projeto.horas_contratadas.toString() : '')
        setCodigoExterno(projeto.codigo_externo ?? '')
        setBillable((projeto as any).billable ?? false)
      } else {
        setNome('')
        setCor(PALETA_CORES[0])
        setStatus('ativo')
        setTipo('projeto')
        setHorasContratadas('')
        setCodigoExterno('')
        setBillable(false)
      }
      setError(null)
    }
  }, [isOpen, projeto])

  const handleCodigoExternoChange = (val: string) => {
    setCodigoExterno(val)
    if (!val.trim()) {
      setBillable(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setError('O nome do projeto é obrigatório.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      let horasParsed = null
      if (tipo === 'projeto' && horasContratadas.trim()) {
        const val = parseFloat(horasContratadas.replace(',', '.'))
        if (!isNaN(val)) {
          horasParsed = val
        }
      }

      await onSave({
        nome: nome.trim(),
        cor,
        tipo,
        horas_contratadas: horasParsed,
        status: projeto ? status : 'ativo',
        codigo_externo: codigoExterno.trim() || null,
        billable: codigoExterno.trim() ? billable : false
      })
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar projeto:', err)
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#161B22] border border-gray-800 rounded-2xl w-[95%] sm:w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-white mb-4 shrink-0">
          {projeto ? 'Editar Projeto' : 'Novo Projeto'}
        </h3>

        {/* Mensagem de Erro do Modal */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Conteúdo interno com scroll */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 mb-4 custom-scrollbar">
            {/* Nome do Projeto */}
            <div>
              <label htmlFor="nome-projeto" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nome do Projeto
              </label>
              <input
                id="nome-projeto"
                type="text"
                required
                placeholder="Ex: App Horas, Freelance, Site Corporativo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] w-full transition-colors"
              />
            </div>

            {/* Tipo do Projeto */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('projeto')}
                  className={`py-2 px-4 rounded-xl font-semibold text-sm border transition-all ${
                    tipo === 'projeto'
                      ? 'bg-[#03A9F4]/10 text-[#03A9F4] border-[#03A9F4]/30'
                      : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  Projeto
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('rotina')}
                  className={`py-2 px-4 rounded-xl font-semibold text-sm border transition-all ${
                    tipo === 'rotina'
                      ? 'bg-[#03A9F4]/10 text-[#03A9F4] border-[#03A9F4]/30'
                      : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  Rotina
                </button>
              </div>
            </div>

            {/* Horas Contratadas */}
            {tipo === 'projeto' && (
              <div>
                <label htmlFor="horas-contratadas" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Horas Contratadas (opcional)
                </label>
                <input
                  id="horas-contratadas"
                  type="text"
                  placeholder="Ex: 100"
                  value={horasContratadas}
                  onChange={(e) => setHorasContratadas(e.target.value)}
                  disabled={temFases}
                  className={`bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none w-full transition-colors ${
                    temFases ? 'cursor-not-allowed opacity-60' : 'focus:border-[#03A9F4]'
                  }`}
                />
                {temFases && (
                  <div className="rounded-lg px-3 py-2 mt-2 text-xs border-l-[3px] border-l-[#8B949E] bg-[#0B0E14] text-[#8B949E] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Este projeto usa fases. As horas contratadas são gerenciadas na página do projeto.</span>
                  </div>
                )}
              </div>
            )}

            {tipo === 'projeto' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Código no Timesheet (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 0815301"
                  value={codigoExterno}
                  onChange={(e) => handleCodigoExternoChange(e.target.value)}
                  className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] w-full transition-colors"
                />
              </div>
            )}

            {tipo === 'projeto' && codigoExterno.trim() !== '' && (
              <div className="flex items-center justify-between p-3 bg-[#161B22] border border-gray-800 rounded-xl">
                <div>
                  <span className="block text-sm font-semibold text-white">Billable</span>
                  <span className="block text-xs text-gray-400">Projeto faturável</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillable(!billable)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    billable ? 'bg-[#03A9F4]' : 'bg-[#1E2A38]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      billable ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Seletor de Cores */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Cor de Identificação
              </label>
              <div className="grid grid-cols-8 gap-2">
                {PALETA_CORES.map((corHex) => (
                  <button
                    key={corHex}
                    type="button"
                    onClick={() => setCor(corHex)}
                    className={`h-9 w-9 rounded-full transition-all border flex items-center justify-center shrink-0 ${
                      cor === corHex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: corHex }}
                    title={corHex}
                  >
                    {cor === corHex && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Status (Apenas para edição) */}
            {projeto && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Status do Projeto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`py-2 px-4 rounded-xl font-semibold text-sm border transition-all ${
                      status === 'ativo'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('encerrado')}
                    className={`py-2 px-4 rounded-xl font-semibold text-sm border transition-all ${
                      status === 'encerrado'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    Encerrado
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all border border-gray-700 focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !nome.trim()}
              className="w-full sm:flex-1 py-3 px-4 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
