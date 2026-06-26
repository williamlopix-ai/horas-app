import React, { useState, useEffect } from 'react'
import type { Lembrete, Projeto } from '../types'
import { getErrorMessage } from '../utils/errors'

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#161B22] border border-gray-800 rounded-2xl w-[95%] sm:w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-white mb-4 shrink-0">
          {lembrete ? 'Editar Lembrete' : 'Novo Lembrete'}
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
            {/* Título do Lembrete */}
            <div>
              <label htmlFor="titulo-lembrete" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Título
              </label>
              <input
                id="titulo-lembrete"
                type="text"
                required
                placeholder="Ex: Enviar relatório, Alinhamento semanal"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] w-full transition-colors"
              />
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao-lembrete" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Descrição (opcional)
              </label>
              <textarea
                id="descricao-lembrete"
                placeholder="Adicione detalhes adicionais sobre o lembrete..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] w-full transition-colors resize-none custom-scrollbar"
              />
            </div>

            {/* Data Alvo */}
            <div>
              <label htmlFor="data-lembrete" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Data do Lembrete
              </label>
              <input
                id="data-lembrete"
                type="date"
                required
                value={dataAlvo}
                onChange={(e) => setDataAlvo(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] w-full transition-colors"
              />
            </div>

            {/* Projeto */}
            <div>
              <label htmlFor="projeto-lembrete" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Projeto (opcional)
              </label>
              <select
                id="projeto-lembrete"
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer transition-colors"
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
              disabled={submitting || !titulo.trim() || !dataAlvo}
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
