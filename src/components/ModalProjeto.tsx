import React, { useState, useEffect, useRef } from 'react'
import type { Projeto, Subcategoria, Fase } from '../types'
import { subcategoriasService } from '../services/subcategorias'
import { fasesService } from '../services/fases'
import { getErrorMessage } from '../utils/errors'
import ModalConfirmacao from './ModalConfirmacao'

interface ModalProjetoProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dados: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; horas_contratadas: number | null; status?: 'ativo' | 'encerrado' | 'excluido'; codigo_externo: string | null; billable: boolean }) => Promise<void>
  projeto?: Projeto | null
  focarSubcategorias?: boolean
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

export default function ModalProjeto({ isOpen, onClose, onSave, projeto, focarSubcategorias }: ModalProjetoProps) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(PALETA_CORES[0])
  const [status, setStatus] = useState<'ativo' | 'encerrado' | 'excluido'>('ativo')
  const [tipo, setTipo] = useState<'projeto' | 'rotina'>('projeto')
  const [horasContratadas, setHorasContratadas] = useState<string>('')
  const [codigoExterno, setCodigoExterno] = useState<string>('')
  const [billable, setBillable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [novaSubcategoria, setNovaSubcategoria] = useState('')
  const [carregandoSubcategorias, setCarregandoSubcategorias] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEditando, setNomeEditando] = useState('')
  const [horasSubEditando, setHorasSubEditando] = useState('')
  const [subExcluindoId, setSubExcluindoId] = useState<string | null>(null)
  const [modoAlocacao, setModoAlocacao] = useState(false)
  const [alocacoes, setAlocacoes] = useState<Record<string, string>>({})
  const [salvandoAlocacoes, setSalvandoAlocacoes] = useState(false)
  const subcategoriasRef = useRef<HTMLDivElement>(null)

  const [fases, setFases] = useState<Fase[]>([])
  const [carregandoFases, setCarregandoFases] = useState(false)
  const [editandoFaseId, setEditandoFaseId] = useState<string | null>(null)
  const [nomeFaseEditando, setNomeFaseEditando] = useState('')
  const [horasFaseEditando, setHorasFaseEditando] = useState('')
  const [faseExcluindoId, setFaseExcluindoId] = useState<string | null>(null)
  const [confirmandoRemoverDivisao, setConfirmandoRemoverDivisao] = useState(false)

  // Efeito para rolar suavemente até a seção de subcategorias caso solicitado
  useEffect(() => {
    if (isOpen && focarSubcategorias) {
      const timer = setTimeout(() => {
        subcategoriasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen, focarSubcategorias])

  // Atualizar os estados internos do formulário quando o modal abre ou o projeto muda
  useEffect(() => {
    if (isOpen) {
      if (projeto) {
        setNome(projeto.nome)
        setCor(projeto.cor)
        setStatus(projeto.status)
        setTipo(projeto.tipo || 'projeto')
        setHorasContratadas(projeto.horas_contratadas ? projeto.horas_contratadas.toString() : '')
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

  // Carregar subcategorias e fases ao abrir o modal para edição
  useEffect(() => {
    if (isOpen && projeto && tipo === 'projeto') {
      const fetchData = async () => {
        setCarregandoSubcategorias(true)
        setCarregandoFases(true)
        try {
          const [subsData, fasesData] = await Promise.all([
            subcategoriasService.listarSubcategorias(projeto.id),
            fasesService.listarFases(projeto.id)
          ])
          setSubcategorias(subsData)
          setFases(fasesData)
        } catch (err) {
          console.error('Erro ao carregar subcategorias/fases', err)
        } finally {
          setCarregandoSubcategorias(false)
          setCarregandoFases(false)
        }
      }
      fetchData()
    } else {
      setSubcategorias([])
      setNovaSubcategoria('')
      setEditandoId(null)
      setNomeEditando('')
      setHorasSubEditando('')
      setSubExcluindoId(null)
      setModoAlocacao(false)
      setAlocacoes({})
      setSalvandoAlocacoes(false)

      setFases([])
      setEditandoFaseId(null)
      setNomeFaseEditando('')
      setHorasFaseEditando('')
      setFaseExcluindoId(null)
      setConfirmandoRemoverDivisao(false)
    }
  }, [isOpen, projeto, tipo])

  const temHorasEmFases = fases.some(f => f.horas_contratadas !== null && f.horas_contratadas !== undefined)
  const somaHorasFases = temHorasEmFases
    ? fases.reduce((acc, f) => acc + (f.horas_contratadas || 0), 0)
    : null

  const formatarHoras = (val: number) => {
    const rounded = Math.round(val * 100) / 100
    return rounded.toString().replace('.', ',')
  }

  const somaAlocada = modoAlocacao
    ? subcategorias.reduce((acc, sub) => {
        const rawVal = alocacoes[sub.id] ?? ''
        let val = 0
        if (rawVal.trim()) {
          const parsed = parseFloat(rawVal.replace(',', '.'))
          if (!isNaN(parsed)) val = parsed
        }
        return acc + val
      }, 0)
    : subcategorias.reduce((acc, sub) => acc + (sub.horas_alocadas || 0), 0)

  let totalContratadoSub: number | null = null
  if (fases.length > 0) {
    totalContratadoSub = somaHorasFases
  } else if (horasContratadas.trim()) {
    const val = parseFloat(horasContratadas.replace(',', '.'))
    if (!isNaN(val)) totalContratadoSub = val
  }

  const handleDividirEmFases = async () => {
    if (!projeto) return
    try {
      setCarregandoFases(true)
      let h1: number | null = null
      if (horasContratadas.trim()) {
        const parsed = parseFloat(horasContratadas.replace(',', '.'))
        if (!isNaN(parsed)) h1 = parsed
      }

      const f1 = await fasesService.criarFase(projeto.usuario_id, projeto.id, 'Fase 1', 1, h1)
      const f2 = await fasesService.criarFase(projeto.usuario_id, projeto.id, 'Fase 2', 2, null)

      await subcategoriasService.atribuirFaseEmLote(projeto.id, f1.id)

      setFases([f1, f2])
      setEditandoFaseId(f2.id)
      setNomeFaseEditando(f2.nome)
      setHorasFaseEditando('')
    } catch (err) {
      console.error('Erro ao dividir em fases', err)
      setError('Erro ao dividir projeto em fases.')
    } finally {
      setCarregandoFases(false)
    }
  }

  const handleStartEditFase = (fase: Fase) => {
    setEditandoFaseId(fase.id)
    setNomeFaseEditando(fase.nome)
    setHorasFaseEditando(fase.horas_contratadas !== null && fase.horas_contratadas !== undefined ? fase.horas_contratadas.toString() : '')
  }

  const handleCancelEditFase = () => {
    setEditandoFaseId(null)
    setNomeFaseEditando('')
    setHorasFaseEditando('')
  }

  const handleSaveEditFase = async (id: string) => {
    if (!nomeFaseEditando.trim()) return
    try {
      setCarregandoFases(true)
      let horasParsed: number | null = null
      if (horasFaseEditando.trim()) {
        const val = parseFloat(horasFaseEditando.replace(',', '.'))
        if (!isNaN(val)) horasParsed = val
      }
      const faseAtualizada = await fasesService.atualizarFase(id, {
        nome: nomeFaseEditando.trim(),
        horas_contratadas: horasParsed
      })
      setFases(fases.map(f => f.id === id ? faseAtualizada : f))
      setEditandoFaseId(null)
      setNomeFaseEditando('')
      setHorasFaseEditando('')
    } catch (err) {
      console.error('Erro ao atualizar fase', err)
      setError('Erro ao atualizar fase.')
    } finally {
      setCarregandoFases(false)
    }
  }

  const handleAddFase = async () => {
    if (!projeto) return
    try {
      setCarregandoFases(true)
      const novaOrdem = fases.length > 0 ? Math.max(...fases.map(f => f.ordem)) + 1 : 1
      const novoNome = `Fase ${novaOrdem}`
      const novaFase = await fasesService.criarFase(projeto.usuario_id, projeto.id, novoNome, novaOrdem, null)
      setFases([...fases, novaFase])
      setEditandoFaseId(novaFase.id)
      setNomeFaseEditando(novaFase.nome)
      setHorasFaseEditando('')
    } catch (err) {
      console.error('Erro ao adicionar fase', err)
      setError('Erro ao adicionar fase.')
    } finally {
      setCarregandoFases(false)
    }
  }

  const handleConfirmarExclusaoFase = async () => {
    if (!faseExcluindoId) return
    try {
      setCarregandoFases(true)
      await fasesService.excluirFase(faseExcluindoId)
      setFases(fases.filter(f => f.id !== faseExcluindoId))
      setFaseExcluindoId(null)
    } catch (err) {
      console.error('Erro ao excluir fase', err)
      setError('Erro ao excluir fase.')
    } finally {
      setCarregandoFases(false)
    }
  }

  const handleConfirmarRemoverDivisao = async () => {
    if (!projeto) return
    try {
      setCarregandoFases(true)
      const valorSomaAnterior = somaHorasFases

      await subcategoriasService.atribuirFaseEmLote(projeto.id, null)
      await Promise.all(fases.map(f => fasesService.excluirFase(f.id)))

      setFases([])
      setHorasContratadas(valorSomaAnterior !== null && valorSomaAnterior !== undefined ? valorSomaAnterior.toString() : '')
      setConfirmandoRemoverDivisao(false)
    } catch (err) {
      console.error('Erro ao remover divisão em fases', err)
      setError('Erro ao remover divisão em fases.')
    } finally {
      setCarregandoFases(false)
    }
  }

  if (!isOpen) return null

  const handleAddSubcategoria = async () => {
    if (!novaSubcategoria.trim() || !projeto) return
    try {
      setCarregandoSubcategorias(true)
      const sub = await subcategoriasService.criarSubcategoria(projeto.usuario_id, projeto.id, novaSubcategoria.trim())
      setSubcategorias([...subcategorias, sub])
      setNovaSubcategoria('')
    } catch (err) {
      console.error('Erro ao adicionar subcategoria', err)
      setError('Erro ao adicionar subcategoria.')
    } finally {
      setCarregandoSubcategorias(false)
    }
  }

  const handleStartEdit = (sub: Subcategoria) => {
    setEditandoId(sub.id)
    setNomeEditando(sub.nome)
    setHorasSubEditando(sub.horas_alocadas !== null && sub.horas_alocadas !== undefined ? sub.horas_alocadas.toString() : '')
  }

  const handleCancelEdit = () => {
    setEditandoId(null)
    setNomeEditando('')
    setHorasSubEditando('')
  }

  const handleSaveEdit = async (id: string) => {
    if (!nomeEditando.trim()) return
    try {
      setCarregandoSubcategorias(true)
      let horasParsed: number | null = null
      if (horasSubEditando.trim()) {
        const val = parseFloat(horasSubEditando.replace(',', '.'))
        if (!isNaN(val)) horasParsed = val
      }
      const subAtualizada = await subcategoriasService.atualizarSubcategoria(id, nomeEditando.trim(), horasParsed)
      setSubcategorias(subcategorias.map(s => s.id === id ? subAtualizada : s))
      setEditandoId(null)
      setNomeEditando('')
      setHorasSubEditando('')
    } catch (err) {
      console.error('Erro ao atualizar subcategoria', err)
      setError('Erro ao atualizar subcategoria.')
    } finally {
      setCarregandoSubcategorias(false)
    }
  }

  const handleConfirmarExclusaoSubcategoria = async () => {
    if (!subExcluindoId) return
    try {
      setCarregandoSubcategorias(true)
      await subcategoriasService.excluirSubcategoria(subExcluindoId)
      setSubcategorias(subcategorias.filter(sub => sub.id !== subExcluindoId))
      setSubExcluindoId(null)
    } catch (err) {
      console.error('Erro ao excluir subcategoria', err)
      setError('Erro ao excluir subcategoria.')
    } finally {
      setCarregandoSubcategorias(false)
    }
  }

  const handleEntrarModoAlocacao = () => {
    if (editandoId) {
      handleCancelEdit()
    }
    const inicial: Record<string, string> = {}
    subcategorias.forEach(sub => {
      inicial[sub.id] = sub.horas_alocadas !== null && sub.horas_alocadas !== undefined ? sub.horas_alocadas.toString() : ''
    })
    setAlocacoes(inicial)
    setModoAlocacao(true)
  }

  const handleCancelarAlocacoes = () => {
    setModoAlocacao(false)
    setAlocacoes({})
  }

  const handleSalvarAlocacoes = async () => {
    try {
      setSalvandoAlocacoes(true)
      setError(null)

      const alteracoes = subcategorias.filter(sub => {
        const rawVal = alocacoes[sub.id] ?? ''
        let novoValor: number | null = null
        if (rawVal.trim()) {
          const parsed = parseFloat(rawVal.replace(',', '.'))
          if (!isNaN(parsed)) novoValor = parsed
        }
        return novoValor !== sub.horas_alocadas
      })

      if (alteracoes.length === 0) {
        setModoAlocacao(false)
        setAlocacoes({})
        return
      }

      const resultados = await Promise.all(
        alteracoes.map(sub => {
          const rawVal = alocacoes[sub.id] ?? ''
          let novoValor: number | null = null
          if (rawVal.trim()) {
            const parsed = parseFloat(rawVal.replace(',', '.'))
            if (!isNaN(parsed)) novoValor = parsed
          }
          return subcategoriasService.atualizarSubcategoria(sub.id, sub.nome, novoValor)
        })
      )

      setSubcategorias(prev =>
        prev.map(sub => {
          const atualizada = resultados.find(r => r.id === sub.id)
          return atualizada || sub
        })
      )

      setModoAlocacao(false)
      setAlocacoes({})
    } catch (err) {
      console.error('Erro ao salvar alocações em lote', err)
      setError('Erro ao salvar alocações das subcategorias.')
    } finally {
      setSalvandoAlocacoes(false)
    }
  }

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
      if (tipo === 'projeto') {
        if (fases.length > 0) {
          horasParsed = somaHorasFases
        } else if (horasContratadas.trim()) {
          const val = parseFloat(horasContratadas.replace(',', '.'))
          if (!isNaN(val)) {
            horasParsed = val
          }
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
                <label htmlFor="horas-contratadas" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Horas Contratadas (opcional)</span>
                  {fases.length > 0 && (
                    <span className="text-[11px] text-gray-400 font-normal normal-case">(somado das fases)</span>
                  )}
                </label>
                <input
                  id="horas-contratadas"
                  type="text"
                  placeholder="Ex: 100"
                  value={fases.length > 0 ? (somaHorasFases !== null ? somaHorasFases.toString() : '') : horasContratadas}
                  onChange={(e) => setHorasContratadas(e.target.value)}
                  readOnly={fases.length > 0}
                  className={`bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none w-full transition-colors ${
                    fases.length > 0 ? 'cursor-not-allowed opacity-80' : 'focus:border-[#03A9F4]'
                  }`}
                />
                {projeto && fases.length === 0 && (
                  <button
                    type="button"
                    onClick={handleDividirEmFases}
                    disabled={carregandoFases}
                    className="mt-1.5 text-xs text-[#03A9F4] hover:underline font-semibold flex items-center gap-1 transition-colors"
                  >
                    + Dividir em fases
                  </button>
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

            {/* Seção de Fases (Apenas quando houver fases) */}
            {tipo === 'projeto' && projeto && fases.length > 0 && (
              <div className="border-t border-gray-800 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Fases
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFase}
                    disabled={carregandoFases}
                    className="text-xs text-[#03A9F4] hover:underline font-semibold transition-colors disabled:opacity-50"
                  >
                    + Adicionar fase
                  </button>
                </div>

                {carregandoFases && fases.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-2">Carregando fases...</div>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {fases.map(fase => (
                      <li key={fase.id} className="flex items-center justify-between bg-[#0B0E14] border border-gray-800 rounded-lg px-3 py-2">
                        {editandoFaseId === fase.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={nomeFaseEditando}
                              onChange={(e) => setNomeFaseEditando(e.target.value)}
                              placeholder="Nome da fase"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSaveEditFase(fase.id)
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  handleCancelEditFase()
                                }
                              }}
                              className="flex-1 bg-[#161B22] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={horasFaseEditando}
                              onChange={(e) => setHorasFaseEditando(e.target.value)}
                              placeholder="Horas"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSaveEditFase(fase.id)
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  handleCancelEditFase()
                                }
                              }}
                              className="w-20 bg-[#161B22] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditFase(fase.id)}
                              disabled={!nomeFaseEditando.trim() || carregandoFases}
                              className="text-emerald-400 hover:text-emerald-300 p-1 disabled:opacity-50"
                              title="Confirmar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditFase}
                              className="text-gray-500 hover:text-gray-300 p-1"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-xs text-gray-500 font-mono">{fase.ordem}.</span>
                              <span className="text-sm text-gray-200 truncate">{fase.nome}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-mono text-gray-400">
                                {fase.horas_contratadas !== null && fase.horas_contratadas !== undefined ? `${fase.horas_contratadas}h` : '—'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditFase(fase)}
                                  className="text-gray-500 hover:text-[#03A9F4] p-1 transition-colors"
                                  title="Editar"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFaseExcluindoId(fase.id)}
                                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                  title="Excluir"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmandoRemoverDivisao(true)}
                  disabled={carregandoFases}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
                >
                  Remover divisão em fases
                </button>
              </div>
            )}

            {/* Subcategorias (Apenas para edição de projeto) */}
            {tipo === 'projeto' && projeto && (
              <div ref={subcategoriasRef} className="border-t border-gray-800 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Subcategorias
                  </label>
                  {subcategorias.length > 0 && !modoAlocacao && (
                    <button
                      type="button"
                      onClick={handleEntrarModoAlocacao}
                      className="text-xs text-[#03A9F4] hover:underline font-semibold transition-colors"
                    >
                      Alocar horas
                    </button>
                  )}
                </div>
                
                {!modoAlocacao && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nova subcategoria..."
                      value={novaSubcategoria}
                      onChange={(e) => setNovaSubcategoria(e.target.value)}
                      className="flex-1 bg-[#0B0E14] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#03A9F4]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSubcategoria()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategoria}
                      disabled={!novaSubcategoria.trim() || carregandoSubcategorias}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                )}

                {carregandoSubcategorias && subcategorias.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-2">Carregando...</div>
                ) : subcategorias.length > 0 ? (
                  <ul className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {subcategorias.map(sub => (
                      <li key={sub.id} className="flex items-center justify-between bg-[#0B0E14] border border-gray-800 rounded-lg px-3 py-2">
                        {modoAlocacao ? (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-sm text-gray-200 truncate flex-1">{sub.nome}</span>
                            <input
                              type="text"
                              value={alocacoes[sub.id] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setAlocacoes(prev => ({ ...prev, [sub.id]: val }))
                              }}
                              placeholder="Horas"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSalvarAlocacoes()
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  handleCancelarAlocacoes()
                                }
                              }}
                              className="w-20 bg-[#161B22] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                            />
                          </div>
                        ) : editandoId === sub.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={nomeEditando}
                              onChange={(e) => setNomeEditando(e.target.value)}
                              placeholder="Nome da subcategoria"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSaveEdit(sub.id)
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  handleCancelEdit()
                                }
                              }}
                              className="flex-1 bg-[#161B22] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={horasSubEditando}
                              onChange={(e) => setHorasSubEditando(e.target.value)}
                              placeholder="Horas"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSaveEdit(sub.id)
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  handleCancelEdit()
                                }
                              }}
                              className="w-20 bg-[#161B22] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(sub.id)}
                              disabled={!nomeEditando.trim() || carregandoSubcategorias}
                              className="text-emerald-400 hover:text-emerald-300 p-1 disabled:opacity-50"
                              title="Confirmar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-300 p-1"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-gray-200 truncate flex-1 mr-2">{sub.nome}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-mono text-[#8B949E]">
                                {sub.horas_alocadas !== null && sub.horas_alocadas !== undefined ? `${formatarHoras(sub.horas_alocadas)}h` : '—'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(sub)}
                                  className="text-gray-500 hover:text-[#03A9F4] p-1 transition-colors"
                                  title="Editar"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSubExcluindoId(sub.id)}
                                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                  title="Excluir"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">Nenhuma subcategoria cadastrada.</div>
                )}

                {tipo === 'projeto' && totalContratadoSub !== null && subcategorias.length > 0 && (() => {
                  const diff = Math.round((totalContratadoSub - somaAlocada) * 100) / 100
                  if (diff > 0) {
                    return (
                      <p className="mt-2 text-xs text-[#8B949E]">
                        Faltam {formatarHoras(diff)}h para alocar nas subcategorias
                      </p>
                    )
                  } else if (diff < 0) {
                    return (
                      <p className="mt-2 text-xs text-[#F44336]">
                        {formatarHoras(Math.abs(diff))}h acima do contratado
                      </p>
                    )
                  } else {
                    return (
                      <p className="mt-2 text-xs text-[#4CAF50]">
                        Totalmente alocado
                      </p>
                    )
                  }
                })()}

                {modoAlocacao && (
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleCancelarAlocacoes}
                      disabled={salvandoAlocacoes}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors border border-gray-700 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvarAlocacoes}
                      disabled={salvandoAlocacoes}
                      className="px-3 py-1.5 bg-[#03A9F4] hover:bg-[#0288D1] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {salvandoAlocacoes ? 'Salvando...' : 'Concluir'}
                    </button>
                  </div>
                )}
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

        {/* Modal de Confirmação de Exclusão de Subcategoria */}
        <ModalConfirmacao
          isOpen={subExcluindoId !== null}
          titulo="Excluir Subcategoria"
          mensagem="Excluir subcategoria? Registros vinculados perderão essa referência."
          perigo={true}
          textoConfirmar="Excluir"
          onConfirmar={handleConfirmarExclusaoSubcategoria}
          onCancelar={() => setSubExcluindoId(null)}
        />

        {/* Modal de Confirmação de Exclusão de Fase */}
        <ModalConfirmacao
          isOpen={faseExcluindoId !== null}
          titulo="Excluir Fase"
          mensagem="Excluir esta fase? As subcategorias dela ficarão sem fase."
          perigo={true}
          textoConfirmar="Excluir"
          onConfirmar={handleConfirmarExclusaoFase}
          onCancelar={() => setFaseExcluindoId(null)}
        />

        {/* Modal de Confirmação de Remover Divisão em Fases */}
        <ModalConfirmacao
          isOpen={confirmandoRemoverDivisao}
          titulo="Remover divisão em fases"
          mensagem="Todas as fases serão excluídas e o projeto voltará ao modo simples. As horas contratadas do projeto serão mantidas."
          perigo={true}
          textoConfirmar="Remover"
          onConfirmar={handleConfirmarRemoverDivisao}
          onCancelar={() => setConfirmandoRemoverDivisao(false)}
        />
      </div>
    </div>
  )
}
