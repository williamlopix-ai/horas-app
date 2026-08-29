import React, { useState, useEffect } from 'react'
import type { Projeto } from '../types'
import { getErrorMessage } from '../utils/errors'
import { useFecharComEsc } from '../hooks/useFecharComEsc'
import { Button, Surface, classeCampo } from './ui'

interface ModalProjetoProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dados: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; horas_contratadas: number | null; status?: 'ativo' | 'encerrado' | 'excluido'; codigo_externo: string | null; billable: boolean }) => Promise<void>
  projeto?: Projeto | null
  temFases?: boolean
}

const PALETA_CORES = [
  { valor: 'var(--proj-1)', nome: 'vermelho' },
  { valor: 'var(--proj-2)', nome: 'laranja' },
  { valor: 'var(--proj-3)', nome: 'ouro' },
  { valor: 'var(--proj-4)', nome: 'lima' },
  { valor: 'var(--proj-5)', nome: 'verde' },
  { valor: 'var(--proj-6)', nome: 'esmeralda' },
  { valor: 'var(--proj-7)', nome: 'ciano' },
  { valor: 'var(--proj-8)', nome: 'azul' },
  { valor: 'var(--proj-9)', nome: 'índigo' },
  { valor: 'var(--proj-10)', nome: 'roxo' },
  { valor: 'var(--proj-11)', nome: 'magenta' },
  { valor: 'var(--proj-12)', nome: 'framboesa' }
]

export default function ModalProjeto({ isOpen, onClose, onSave, projeto, temFases }: ModalProjetoProps) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(PALETA_CORES[0].valor)
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
        setCor(PALETA_CORES[0].valor)
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

  useFecharComEsc(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Surface
        elevacao={2}
        padding="lg"
        comBorda
        comSombra={false}
        className="w-[95%] sm:w-full max-w-md relative shadow-e3 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-700 hover:text-ink-900 transition-colors focus:outline-none z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-lg h-icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-ink-900 mb-4 shrink-0">
          {projeto ? 'Editar Projeto' : 'Novo Projeto'}
        </h3>

        {/* Mensagem de Erro do Modal */}
        {error && (
          <div className="mb-4 p-3 bg-bad-bg border border-bad rounded-card text-bad text-xs flex items-center gap-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-sm h-icon-sm shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              <label htmlFor="nome-projeto" className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Nome do Projeto
              </label>
              <input
                id="nome-projeto"
                type="text"
                required
                placeholder="Ex: App Horas, Freelance, Site Corporativo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`${classeCampo()} min-h-[44px]`}
              />
            </div>

            {/* Tipo do Projeto */}
            <div>
              <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  type="button"
                  onClick={() => setTipo('projeto')}
                  className={`py-3 px-4 min-h-[44px] flex items-center justify-center rounded-ctl font-semibold text-sm border transition-all ${
                    tipo === 'projeto'
                      ? 'bg-accent-bg text-accent-fg border-accent'
                      : 'bg-transparent text-ink-500 border-hair hover:border-hair-strong'
                  }`}
                >
                  Projeto
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('rotina')}
                  className={`py-3 px-4 min-h-[44px] flex items-center justify-center rounded-ctl font-semibold text-sm border transition-all ${
                    tipo === 'rotina'
                      ? 'bg-accent-bg text-accent-fg border-accent'
                      : 'bg-transparent text-ink-500 border-hair hover:border-hair-strong'
                  }`}
                >
                  Rotina
                </button>
              </div>
            </div>

            {/* Horas Contratadas */}
            {projeto && tipo === 'projeto' && (
              <div>
                <label htmlFor="horas-contratadas" className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                  Horas Contratadas (opcional)
                </label>
                <input
                  id="horas-contratadas"
                  type="text"
                  placeholder="Ex: 100"
                  value={horasContratadas}
                  onChange={(e) => setHorasContratadas(e.target.value)}
                  disabled={temFases}
                  className={`${classeCampo()} min-h-[44px] ${temFases ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                {temFases && (
                  <div className="rounded-card px-3 py-2 mt-2 text-xs border-l-[3px] border-l-ink-500 bg-surface-3 text-ink-500 flex items-center gap-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-xs h-icon-xs shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Este projeto usa fases. As horas contratadas são gerenciadas na página do projeto.</span>
                  </div>
                )}
              </div>
            )}

            {tipo === 'projeto' && (
              <div>
                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                  Código no Timesheet (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 0815301"
                  value={codigoExterno}
                  onChange={(e) => handleCodigoExternoChange(e.target.value)}
                  className={`${classeCampo()} min-h-[44px]`}
                />
              </div>
            )}

            {tipo === 'projeto' && codigoExterno.trim() !== '' && (
              <label
                onClick={() => setBillable(!billable)}
                className="flex items-center justify-between p-3 bg-surface-3 border border-hair rounded-card min-h-[44px] cursor-pointer select-none"
              >
                <div>
                  <span className="block text-sm font-semibold text-ink-900">Billable</span>
                  <span className="block text-xs text-ink-500">Projeto faturável</span>
                </div>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-d1 shrink-0 ${
                    billable ? 'bg-accent' : 'bg-surface-0'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-d1 ${
                      billable ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            )}

            {/* Seletor de Cores */}
            <div>
              <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Cor de Identificação
              </label>
              <div className="grid grid-cols-6 gap-2xs sm:gap-sm">
                {PALETA_CORES.map((itemCor) => (
                  <button
                    key={itemCor.valor}
                    type="button"
                    onClick={() => setCor(itemCor.valor)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all focus:outline-none shrink-0"
                    title={itemCor.nome}
                  >
                    <span
                      className={`h-9 w-9 rounded-full transition-all border flex items-center justify-center shrink-0 ${
                        cor === itemCor.valor ? 'border-ink-900 scale-110 shadow-e2' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: itemCor.valor }}
                    >
                      {cor === itemCor.valor && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-sm h-icon-sm text-white drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status (Apenas para edição) */}
            {projeto && (
              <div>
                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                  Status do Projeto
                </label>
                <div className="grid grid-cols-2 gap-sm">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`py-3 px-4 min-h-[44px] flex items-center justify-center rounded-ctl font-semibold text-sm border transition-all ${
                      status === 'ativo'
                        ? 'bg-ok-bg text-ok border-ok'
                        : 'bg-transparent text-ink-500 border-hair hover:border-hair-strong'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('encerrado')}
                    className={`py-3 px-4 min-h-[44px] flex items-center justify-center rounded-ctl font-semibold text-sm border transition-all ${
                      status === 'encerrado'
                        ? 'bg-bad-bg text-bad border-bad'
                        : 'bg-transparent text-ink-500 border-hair hover:border-hair-strong'
                    }`}
                  >
                    Encerrado
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div
            className="flex flex-col sm:flex-row gap-md pt-4 border-t border-hair shrink-0"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <Button
              variante="secundario"
              larguraTotal
              className="sm:flex-1 min-h-[44px]"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variante="primario"
              type="submit"
              larguraTotal
              className="sm:flex-1 min-h-[44px]"
              disabled={submitting || !nome.trim()}
              carregando={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  )
}
