import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listarProjetos } from '../services/projetos'
import type { Registro, Projeto } from '../types'

interface ModalRegistroProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dados: {
    projeto_id: string | null
    data: string
    hora_inicio: string
    hora_fim: string
    observacao: string | null
  }) => Promise<void>
  registro?: (Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina' } | null }) | null
  registrosExistentes?: (Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina' } | null })[]
}

// Função auxiliar para obter a data local de hoje no formato YYYY-MM-DD
function obterDataLocalHoje(): string {
  const hoje = new Date()
  const yyyy = hoje.getFullYear()
  const mm = String(hoje.getMonth() + 1).padStart(2, '0')
  const dd = String(hoje.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Função para formatar duração no formato legível (ex: "1h30min")
function formatarDuracaoHumana(horaInicio: string, horaFim: string): string {
  if (!horaInicio || !horaFim) return '0h00min'
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFim.split(':').map(Number)

  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '0h00min'

  const totalMinutosInicio = h1 * 60 + m1
  const totalMinutosFim = h2 * 60 + m2
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio

  if (diferencaMinutos <= 0) return '0h00min'

  const horas = Math.floor(diferencaMinutos / 60)
  const minutos = diferencaMinutos % 60

  return `${horas}h${String(minutos).padStart(2, '0')}min`
}

// Função auxiliar para calcular a duração centesimal
function calcularDuracaoCentesimal(horaInicio: string, horaFim: string): number {
  if (!horaInicio || !horaFim) return 0
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFim.split(':').map(Number)

  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0

  const totalMinutosInicio = h1 * 60 + m1
  const totalMinutosFim = h2 * 60 + m2
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio

  if (diferencaMinutos <= 0) return 0

  const horasInteiras = Math.floor(diferencaMinutos / 60)
  const minutosRestantes = diferencaMinutos % 60
  
  const duracao = horasInteiras + (minutosRestantes / 60)
  return Math.round(duracao * 100) / 100
}

export default function ModalRegistro({ isOpen, onClose, onSave, registro, registrosExistentes = [] }: ModalRegistroProps) {
  const { user } = useAuth()
  
  // Estados do Form
  const [projetoId, setProjetoId] = useState<string>('')
  const [data, setData] = useState<string>(obterDataLocalHoje())
  const [horaInicio, setHoraInicio] = useState<string>('09:00')
  const [horaFim, setHoraFim] = useState<string>('18:00')
  const [observacao, setObservacao] = useState<string>('')

  // Estados Operacionais
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar projetos do usuário para o dropdown
  useEffect(() => {
    if (isOpen && user) {
      listarProjetos(user.id)
        .then((dados) => {
          // Apenas projetos ativos podem ser associados a novos registros
          // Mas se estiver editando, devemos permitir o projeto atual mesmo se inativo
          const projetosPermitidos = dados.filter(p => p.status === 'ativo' || p.id === registro?.projeto_id)
          setProjetos(projetosPermitidos)
        })
        .catch((err) => {
          console.error('Erro ao carregar projetos no modal:', err)
        })
    }
  }, [isOpen, user, registro])

  // Monitorar preenchimento ao abrir para modo edição ou criação
  useEffect(() => {
    if (isOpen) {
      if (registro) {
        setProjetoId(registro.projeto_id || '')
        setData(registro.data)
        setHoraInicio(registro.hora_inicio.slice(0, 5)) // Garantir formato HH:MM
        setHoraFim(registro.hora_fim.slice(0, 5)) // Garantir formato HH:MM
        setObservacao(registro.observacao || '')
      } else {
        setProjetoId('')
        setData(obterDataLocalHoje())
        setHoraInicio('09:00')
        setHoraFim('18:00')
        setObservacao('')
      }
      setError(null)
    }
  }, [isOpen, registro])

  // Validações em tempo real
  const validacaoErro = useMemo(() => {
    if (!horaInicio || !horaFim) return null

    const [h1, m1] = horaInicio.split(':').map(Number)
    const [h2, m2] = horaFim.split(':').map(Number)
    const totalMinutosInicio = h1 * 60 + m1
    const totalMinutosFim = h2 * 60 + m2

    if (totalMinutosFim <= totalMinutosInicio) {
      return 'A hora de fim deve ser estritamente maior que a hora de início.'
    }

    if (data && registrosExistentes.length > 0) {
      const registrosDoDia = registrosExistentes.filter(r => r.data === data && r.id !== registro?.id)
      
      for (const reg of registrosDoDia) {
        const [regH1, regM1] = reg.hora_inicio.split(':').map(Number)
        const [regH2, regM2] = reg.hora_fim.split(':').map(Number)
        const regTotalInicio = regH1 * 60 + regM1
        const regTotalFim = regH2 * 60 + regM2

        if (totalMinutosInicio < regTotalFim && totalMinutosFim > regTotalInicio) {
          const nomeProjeto = reg.projeto?.nome || 'Sem Projeto'
          return `⚠ Conflito com ${nomeProjeto} (${reg.hora_inicio.slice(0, 5)} - ${reg.hora_fim.slice(0, 5)})`
        }
      }
    }

    return null
  }, [horaInicio, horaFim, data, registro, registrosExistentes])

  if (!isOpen) return null

  // Calcular Duração para o Preview
  const duracaoCentesimal = calcularDuracaoCentesimal(horaInicio, horaFim)
  const duracaoHumana = formatarDuracaoHumana(horaInicio, horaFim)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projetoId) {
      setError('A seleção de um projeto é obrigatória.')
      return
    }
    if (!data) {
      setError('A data do registro é obrigatória.')
      return
    }
    if (validacaoErro) {
      setError(validacaoErro)
      return
    }

    try {
      setSubmitting(true)
      await onSave({
        projeto_id: projetoId === 'nenhum' ? null : projetoId,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        observacao: observacao.trim() || null
      })
    } catch (err: any) {
      console.error('Erro ao salvar lançamento:', err)
      setError('Falha ao registrar suas horas. Verifique os dados fornecidos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Cabeçalho */}
        <h3 className="text-xl font-bold text-white mb-6">
          {registro ? 'Editar Lançamento' : 'Novo Lançamento de Horas'}
        </h3>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Layout de Duas Colunas */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Campos */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Projeto */}
            <div>
              <label htmlFor="modal-projeto" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Projeto *
              </label>
              <select
                id="modal-projeto"
                required
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer transition-colors"
              >
                <option value="" disabled>Selecione um projeto...</option>
                
                {projetos.filter(p => p.tipo === 'projeto' || !p.tipo).length > 0 && (
                  <optgroup label="── PROJETOS ──" className="bg-[#161B22] text-gray-400 font-bold">
                    {projetos.filter(p => p.tipo === 'projeto' || !p.tipo).map((p) => (
                      <option key={p.id} value={p.id} className="text-white font-normal bg-[#0B0E14]">
                        {p.nome}
                      </option>
                    ))}
                  </optgroup>
                )}

                {projetos.filter(p => p.tipo === 'rotina').length > 0 && (
                  <optgroup label="── ROTINA ──" className="bg-[#161B22] text-gray-400 font-bold">
                    {projetos.filter(p => p.tipo === 'rotina').map((p) => (
                      <option key={p.id} value={p.id} className="text-white font-normal bg-[#0B0E14]">
                        {p.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Data */}
            <div>
              <label htmlFor="modal-data" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Data do Lançamento *
              </label>
              <input
                id="modal-data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer transition-colors"
              />
            </div>

            {/* Horários (Lado a Lado) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="modal-inicio" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Início *
                </label>
                <input
                  id="modal-inicio"
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer transition-colors"
                />
              </div>

              <div>
                <label htmlFor="modal-fim" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Fim *
                </label>
                <input
                  id="modal-fim"
                  type="time"
                  required
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className={`bg-[#0B0E14] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none w-full cursor-pointer transition-colors ${
                    validacaoErro ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-[#03A9F4]'
                  }`}
                />
              </div>
            </div>

            {/* Validação de erro de horário */}
            {validacaoErro && (
              <p className="text-[11px] text-red-400 font-semibold mt-1">{validacaoErro}</p>
            )}

            {/* Observações */}
            <div>
              <label htmlFor="modal-obs" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Observações
              </label>
              <textarea
                id="modal-obs"
                rows={2}
                placeholder="Ex: Reunião de alinhamento técnico, refatoração de código..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] w-full resize-none transition-colors"
              />
            </div>

          </div>

          {/* Coluna Direita: Preview Centesimal */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="bg-[#0B0E14] border border-gray-800 rounded-2xl p-5 flex flex-col justify-center items-center text-center h-full space-y-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Duração Centesimal
              </span>

              {/* Destaque Gigante */}
              <div className="space-y-1 py-4">
                <div className="text-4xl font-mono font-extrabold text-[#03A9F4] tracking-tight animate-pulse">
                  {duracaoCentesimal.toFixed(2).replace('.', ',')}h
                </div>
                <div className="text-xs font-semibold text-gray-400">
                  {duracaoHumana} em minutos reais
                </div>
              </div>

              {/* Informação Técnica */}
              <div className="bg-[#161B22] border border-gray-800/80 rounded-xl p-3 w-full space-y-1.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  Regra de Conversão
                </span>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Minutos convertidos centesimalmente para facilitar faturamento e cálculos.
                </p>
                <div className="text-[11px] font-mono font-bold text-gray-300 bg-[#0B0E14] py-1 px-2 rounded mt-1 border border-gray-800/50">
                  {duracaoHumana} = {duracaoCentesimal.toFixed(2).replace('.', ',')}h
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-6 md:pt-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all border border-gray-700 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !!validacaoErro || !projetoId || !data}
                className="flex-1 py-3 px-4 bg-[#03A9F4] hover:bg-[#0091d2] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  )
}
