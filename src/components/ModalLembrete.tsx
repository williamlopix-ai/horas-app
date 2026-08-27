import React, { useState, useEffect } from 'react'
import type { Lembrete, Projeto } from '../types'
import { getErrorMessage } from '../utils/errors'
import { Surface, Button, classeCampo } from './ui'

interface ModalLembreteProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dados: {
    titulo: string
    descricao: string | null
    data_alvo: string
    projeto_id: string | null
  }) => Promise<void>
  lembrete?: Lembrete | null
  projetos: Projeto[]
}

export default function ModalLembrete({ isOpen, onClose, onSave, lembrete, projetos }: ModalLembreteProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataAlvo, setDataAlvo] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Atualizar os estados internos do formulário quando o modal abre ou o lembrete muda
  useEffect(() => {
    if (isOpen) {
      if (lembrete) {
        setTitulo(lembrete.titulo)
        setDescricao(lembrete.descricao || '')
        setDataAlvo(lembrete.data_alvo)
        setProjetoId(lembrete.projeto_id || '')
      } else {
        setTitulo('')
        setDescricao('')
        // Sugerir a data de hoje por padrão para novos lembretes
        const hoje = new Date()
        const yyyy = hoje.getFullYear()
        const mm = String(hoje.getMonth() + 1).padStart(2, '0')
        const dd = String(hoje.getDate()).padStart(2, '0')
        setDataAlvo(`${yyyy}-${mm}-${dd}`)
        setProjetoId('')
      }
      setError(null)
    }
  }, [isOpen, lembrete])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('O título do lembrete é obrigatório.')
      return
    }
    if (!dataAlvo) {
      setError('A data do lembrete é obrigatória.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      await onSave({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data_alvo: dataAlvo,
        projeto_id: projetoId || null
      })
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar lembrete:', err)
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-ink-900 mb-4 shrink-0">
          {lembrete ? 'Editar Lembrete' : 'Novo Lembrete'}
        </h3>

        {/* Mensagem de Erro do Modal */}
        {error && (
          <div className="mb-4 p-3 bg-bad-bg border border-bad rounded-xl text-bad text-xs flex items-center gap-2 shrink-0">
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
            {/* Título do Lembrete */}
            <div>
              <label htmlFor="titulo-lembrete" className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Título
              </label>
              <input
                id="titulo-lembrete"
                type="text"
                required
                placeholder="Ex: Enviar relatório, Alinhamento semanal"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={`${classeCampo()} min-h-[44px]`}
              />
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao-lembrete" className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Descrição (opcional)
              </label>
              <textarea
                id="descricao-lembrete"
                placeholder="Adicione detalhes adicionais sobre o lembrete..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className={`${classeCampo()} min-h-[44px] resize-none custom-scrollbar`}
              />
            </div>

            {/* Data Alvo */}
            <div>
              <label htmlFor="data-lembrete" className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Data do Lembrete
              </label>
              <input
                id="data-lembrete"
                type="date"
                required
                value={dataAlvo}
                onChange={(e) => setDataAlvo(e.target.value)}
                className={`${classeCampo()} min-h-[44px] cursor-pointer`}
              />
            </div>

            {/* Projeto */}
            <div>
              <label htmlFor="projeto-lembrete" className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                Projeto (opcional)
              </label>
              <select
                id="projeto-lembrete"
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className={`${classeCampo()} min-h-[44px] cursor-pointer`}
              >
                <option value="">Nenhum (sem projeto)</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões */}
          <div
            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-hair shrink-0"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <Button
              variante="secundario"
              type="button"
              larguraTotal
              className="sm:flex-1 min-h-[44px]"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variante="primario"
              type="submit"
              larguraTotal
              className="sm:flex-1 min-h-[44px]"
              carregando={submitting}
              disabled={submitting || !titulo.trim() || !dataAlvo}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  )
}
