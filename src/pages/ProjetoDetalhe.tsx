import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Sidebar from '../components/Sidebar'
import type { SubcategoriaBreakdownItem } from '../components/BreakdownSubcategorias'
import ModalRegistro from '../components/ModalRegistro'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { SkeletonCard } from '../components/Skeleton'
import { listarProjetos } from '../services/projetos'
import { listarRegistros, atualizarRegistro, calcularSemanaInicio } from '../services/registros'
import { subcategoriasService } from '../services/subcategorias'
import { fasesService } from '../services/fases'
import { getErrorMessage } from '../utils/errors'
import type { Projeto, Registro, Subcategoria, Fase } from '../types'

type RegistroComDetalhes = Registro & {
  projeto: {
    nome: string
    cor: string
    tipo: 'projeto' | 'rotina'
    status: 'ativo' | 'encerrado' | 'excluido'
    nome_original: string | null
  } | null
  subcategoria?: { nome: string } | null
}

export default function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [registros, setRegistros] = useState<RegistroComDetalhes[]>([])
  const [todosRegistros, setTodosRegistros] = useState<RegistroComDetalhes[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [fases, setFases] = useState<Fase[]>([])

  const [fasesExpandidas, setFasesExpandidas] = useState<Record<string, boolean>>({})

  // Estados de gestão de Fases na página
  const [editandoFaseId, setEditandoFaseId] = useState<string | null>(null)
  const [nomeFaseEditando, setNomeFaseEditando] = useState('')
  const [horasFaseEditando, setHorasFaseEditando] = useState('')
  const [faseExcluindoId, setFaseExcluindoId] = useState<string | null>(null)
  const [faseComSubsExcluindo, setFaseComSubsExcluindo] = useState<{ faseId: string; destinoFaseId: string } | null>(null)
  const [confirmandoRemoverDivisao, setConfirmandoRemoverDivisao] = useState(false)
  const [salvandoFase, setSalvandoFase] = useState(false)

  // Estados de gestão de Subcategorias na página
  const [editandoSubId, setEditandoSubId] = useState<string | null>(null)
  const [nomeSubEditando, setNomeSubEditando] = useState('')
  const [subExcluindoId, setSubExcluindoId] = useState<string | null>(null)
  const [adicionandoEmFaseId, setAdicionandoEmFaseId] = useState<string | null>(null)
  const [novaSubNome, setNovaSubNome] = useState('')
  const [adicionandoSemFase, setAdicionandoSemFase] = useState(false)
  const [modoAlocacao, setModoAlocacao] = useState(false)
  const [alocacoes, setAlocacoes] = useState<Record<string, string>>({})
  const [salvandoAlocacoes, setSalvandoAlocacoes] = useState(false)
  const [salvandoSub, setSalvandoSub] = useState(false)

  // Estados da seção Lançamentos / Modal de Registro
  const [isModalRegistroOpen, setIsModalRegistroOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<RegistroComDetalhes | null>(null)
  const [semanasExpandidas, setSemanasExpandidas] = useState<Record<string, boolean>>({})

  const carregarDados = async (silencioso = false) => {
    if (!user || !id) return
    try {
      if (!silencioso) setLoading(true)
      setError(null)

      const [projs, todosRegs, subs, fas] = await Promise.all([
        listarProjetos(user.id),
        listarRegistros(user.id),
        subcategoriasService.listarSubcategorias(id),
        fasesService.listarFases(id)
      ])

      const regsDoProjeto = todosRegs.filter(r => r.projeto_id === id)
      const projEncontrado = projs.find(p => p.id === id) || null

      setProjeto(projEncontrado)
      setTodosRegistros(todosRegs)
      setRegistros(regsDoProjeto)
      setSubcategorias(subs)
      setFases(fas)

      const subIdsPorFase: Record<string, Set<string>> = {}
      fas.forEach(f => {
        const ids = subs.filter(s => s.fase_id === f.id).map(s => s.id)
        subIdsPorFase[f.id] = new Set(ids)
      })

      const expandidasMap: Record<string, boolean> = {}
      fas.forEach(f => {
        const setIds = subIdsPorFase[f.id] || new Set()
        const duracaoFase = regsDoProjeto
          .filter(r => r.subcategoria_id && setIds.has(r.subcategoria_id))
          .reduce((acc, r) => acc + r.duracao, 0)
        expandidasMap[f.id] = duracaoFase > 0
      })
      setFasesExpandidas(expandidasMap)

    } catch (err: unknown) {
      console.error('Erro ao carregar detalhes do projeto:', err)
      setError(getErrorMessage(err))
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user, id])

  const toggleFase = (faseId: string) => {
    setFasesExpandidas(prev => ({ ...prev, [faseId]: !prev[faseId] }))
  }

  const formatarDataCurta = (dataStr: string) => {
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const [, rm, rd] = dataStr.split('-').map(Number)
    return `${String(rd).padStart(2, '0')} ${mesesAbrev[rm - 1]}`
  }

  const formatarSemanaLabel = (semanaInicioStr: string) => {
    const [, m, d] = semanaInicioStr.split('-')
    return `Semana de ${d}/${m}`
  }

  const toggleSemana = (semanaKey: string, isFirst: boolean) => {
    setSemanasExpandidas(prev => {
      const atual = prev[semanaKey] !== undefined ? prev[semanaKey] : isFirst
      return { ...prev, [semanaKey]: !atual }
    })
  }

  const registrosPorSemana = useMemo(() => {
    const grupos: Record<string, typeof registros> = {}
    registros.forEach(r => {
      const sem = r.semana_inicio || calcularSemanaInicio(r.data)
      if (!grupos[sem]) grupos[sem] = []
      grupos[sem].push(r)
    })

    const semanasOrdenadas = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

    return semanasOrdenadas.map(sem => {
      const regs = [...grupos[sem]].sort((a, b) => {
        if (a.data !== b.data) {
          return b.data.localeCompare(a.data)
        }
        return b.hora_inicio.localeCompare(a.hora_inicio)
      })

      const totalHorasSemana = regs.reduce((acc, r) => acc + r.duracao, 0)

      return {
        semanaInicio: sem,
        totalHoras: totalHorasSemana,
        registros: regs
      }
    })
  }, [registros])

  const abrirEditarRegistro = (reg: RegistroComDetalhes) => {
    setEditingRegistro(reg)
    setIsModalRegistroOpen(true)
  }

  const fecharModalRegistro = () => {
    setIsModalRegistroOpen(false)
    setEditingRegistro(null)
  }

  const handleSalvarRegistro = async (dados: {
    projeto_id: string | null
    subcategoria_id: string | null
    data: string
    hora_inicio: string
    hora_fim: string
    observacao: string | null
  }) => {
    if (!editingRegistro) return
    try {
      await atualizarRegistro(editingRegistro.id, dados)
      await carregarDados(true)
      fecharModalRegistro()
      showToast('Registro salvo!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao salvar registro:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleDividirEmFases = async () => {
    if (!user || !projeto) return
    try {
      setSalvandoFase(true)
      const h1 = projeto.horas_contratadas
      const f1 = await fasesService.criarFase(user.id, projeto.id, 'Fase 1', 1, h1)
      const f2 = await fasesService.criarFase(user.id, projeto.id, 'Fase 2', 2, null)

      await subcategoriasService.atribuirFaseEmLote(projeto.id, f1.id)

      await carregarDados(true)
      setEditandoFaseId(f2.id)
      setNomeFaseEditando(f2.nome)
      setHorasFaseEditando('')
    } catch (err: unknown) {
      console.error('Erro ao dividir em fases:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleAddFase = async () => {
    if (!user || !projeto) return
    try {
      setSalvandoFase(true)
      const novaOrdem = fases.length > 0 ? Math.max(...fases.map(f => f.ordem)) + 1 : 1
      const novoNome = `Fase ${novaOrdem}`
      const novaFase = await fasesService.criarFase(user.id, projeto.id, novoNome, novaOrdem, null)
      await carregarDados(true)
      setEditandoFaseId(novaFase.id)
      setNomeFaseEditando(novaFase.nome)
      setHorasFaseEditando('')
    } catch (err: unknown) {
      console.error('Erro ao adicionar fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
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

  const handleSaveEditFase = async (faseId: string) => {
    if (!nomeFaseEditando.trim()) return
    try {
      setSalvandoFase(true)
      let horasParsed: number | null = null
      if (horasFaseEditando.trim()) {
        const val = parseFloat(horasFaseEditando.replace(',', '.'))
        if (!isNaN(val)) horasParsed = val
      }
      await fasesService.atualizarFase(faseId, {
        nome: nomeFaseEditando.trim(),
        horas_contratadas: horasParsed
      })
      await carregarDados(true)
      setEditandoFaseId(null)
      setNomeFaseEditando('')
      setHorasFaseEditando('')
    } catch (err: unknown) {
      console.error('Erro ao atualizar fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  useEffect(() => {
    if (!faseComSubsExcluindo || salvandoFase) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFaseComSubsExcluindo(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [faseComSubsExcluindo, salvandoFase])

  const handleClicarExcluirFase = (fase: Fase) => {
    if (fases.length <= 1) {
      setConfirmandoRemoverDivisao(true)
      return
    }

    const subsDaFase = subcategorias.filter(s => s.fase_id === fase.id)
    if (subsDaFase.length === 0) {
      setFaseExcluindoId(fase.id)
    } else {
      const outrasFases = fases
        .filter(f => f.id !== fase.id)
        .sort((a, b) => a.ordem - b.ordem)

      const padraoDestino = outrasFases.length > 0 ? outrasFases[0].id : ''
      setFaseComSubsExcluindo({ faseId: fase.id, destinoFaseId: padraoDestino })
    }
  }

  const handleConfirmarExclusaoFaseComSubs = async (faseId: string, destinoFaseIdRaw: string) => {
    try {
      setSalvandoFase(true)
      const destinoFaseId = destinoFaseIdRaw.trim() !== '' ? destinoFaseIdRaw : null
      const subsDaFase = subcategorias.filter(s => s.fase_id === faseId)

      if (subsDaFase.length > 0) {
        await Promise.all(
          subsDaFase.map(sub =>
            subcategoriasService.atualizarSubcategoria(sub.id, sub.nome, undefined, destinoFaseId)
          )
        )
      }

      await fasesService.excluirFase(faseId)
      setFaseComSubsExcluindo(null)
      await carregarDados(true)
    } catch (err: unknown) {
      console.error('Erro ao excluir fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleConfirmarExclusaoFase = async () => {
    if (!faseExcluindoId) return
    try {
      setSalvandoFase(true)
      await fasesService.excluirFase(faseExcluindoId)
      setFaseExcluindoId(null)
      await carregarDados(true)
    } catch (err: unknown) {
      console.error('Erro ao excluir fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleConfirmarRemoverDivisao = async () => {
    if (!projeto) return
    try {
      setSalvandoFase(true)
      await subcategoriasService.atribuirFaseEmLote(projeto.id, null)
      await Promise.all(fases.map(f => fasesService.excluirFase(f.id)))
      setConfirmandoRemoverDivisao(false)
      await carregarDados(true)
    } catch (err: unknown) {
      console.error('Erro ao remover divisão em fases:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  // Handlers para Subcategorias
  const formatarHoras = (val: number) => {
    const rounded = Math.round(val * 100) / 100
    return rounded.toString().replace('.', ',')
  }

  const handleStartEditSub = (sub: SubcategoriaBreakdownItem) => {
    if (modoAlocacao || !sub.id) return
    setEditandoSubId(sub.id)
    setNomeSubEditando(sub.nome)
  }

  const handleCancelEditSub = () => {
    setEditandoSubId(null)
    setNomeSubEditando('')
  }

  const handleSaveEditSub = async (subId: string) => {
    if (!nomeSubEditando.trim()) return
    try {
      setSalvandoSub(true)
      await subcategoriasService.atualizarSubcategoria(subId, nomeSubEditando.trim())
      await carregarDados(true)
      handleCancelEditSub()
      showToast('Subcategoria salva!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao salvar subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleConfirmarExclusaoSub = async () => {
    if (!subExcluindoId) return
    try {
      setSalvandoSub(true)
      await subcategoriasService.excluirSubcategoria(subExcluindoId)
      setSubExcluindoId(null)
      await carregarDados(true)
      showToast('Subcategoria excluída!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao excluir subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleConfirmAddSubcategoria = async (faseId: string | null) => {
    if (!novaSubNome.trim() || !user || !projeto) return
    try {
      setSalvandoSub(true)
      await subcategoriasService.criarSubcategoria(user.id, projeto.id, novaSubNome.trim(), faseId)
      await carregarDados(true)
      setNovaSubNome('')
      setAdicionandoEmFaseId(null)
      setAdicionandoSemFase(false)
      showToast('Subcategoria criada!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao criar subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleEntrarModoAlocacao = () => {
    handleCancelEditSub()
    const inicial: Record<string, string> = {}
    subcategorias.forEach(sub => {
      inicial[sub.id] = sub.horas_alocadas !== null && sub.horas_alocadas !== undefined
        ? (Number.isInteger(sub.horas_alocadas) ? sub.horas_alocadas.toString() : sub.horas_alocadas.toString().replace('.', ','))
        : ''
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
      const alteracoes = subcategorias.filter(sub => {
        const rawVal = alocacoes[sub.id] ?? ''
        let novoValor: number | null = null
        if (rawVal.trim()) {
          const parsed = parseFloat(rawVal.replace(',', '.'))
          if (!isNaN(parsed)) novoValor = parsed
        }
        return novoValor !== (sub.horas_alocadas ?? null)
      })

      if (alteracoes.length > 0) {
        await Promise.all(
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
        await carregarDados(true)
        showToast('Alocações salvas com sucesso!', 'success')
      }
      setModoAlocacao(false)
      setAlocacoes({})
    } catch (err: unknown) {
      console.error('Erro ao salvar alocações:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoAlocacoes(false)
    }
  }

  const renderListaSubcategorias = (items: SubcategoriaBreakdownItem[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-xs text-gray-500 italic py-2">
          Nenhuma subcategoria cadastrada.
        </div>
      )
    }

    const temAlgumaAlocacao = items.some(sub => {
      if (sub.id === null) return false
      if (modoAlocacao) {
        const raw = alocacoes[sub.id] ?? ''
        const parsed = parseFloat(raw.replace(',', '.'))
        return !isNaN(parsed) && parsed > 0
      }
      return sub.horas_alocadas !== null && sub.horas_alocadas > 0
    })

    const somaSemAlocacao = items.reduce((acc, sub) => {
      let temAloc = false
      if (sub.id !== null) {
        if (modoAlocacao) {
          const raw = alocacoes[sub.id] ?? ''
          const parsed = parseFloat(raw.replace(',', '.'))
          temAloc = !isNaN(parsed) && parsed > 0
        } else {
          temAloc = sub.horas_alocadas !== null && sub.horas_alocadas > 0
        }
      }
      if (!temAloc) {
        return acc + sub.duracao
      }
      return acc
    }, 0)

    const exibirRodape = temAlgumaAlocacao && somaSemAlocacao > 0

    return (
      <div className="bg-[#1E2530]/50 rounded-xl p-4 border border-gray-800/60 space-y-3">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Subcategorias</span>
        <div className="space-y-2.5">
          {items.map((sub) => {
            const isBaldeSemSub = sub.id === null
            const rawAloc = modoAlocacao && !isBaldeSemSub ? (alocacoes[sub.id!] ?? '') : null
            const horasAlocadasEfetivas = modoAlocacao && !isBaldeSemSub
              ? (rawAloc && !isNaN(parseFloat(rawAloc.replace(',', '.'))) ? parseFloat(rawAloc.replace(',', '.')) : null)
              : sub.horas_alocadas

            const temAlocacao = !isBaldeSemSub && horasAlocadasEfetivas !== null && horasAlocadasEfetivas > 0
            const excedeu = temAlocacao && sub.duracao > horasAlocadasEfetivas!
            const percentualAlocado = temAlocacao ? Math.round((sub.duracao / horasAlocadasEfetivas!) * 100) : 0
            const larguraBarra = temAlocacao ? Math.min(100, Math.max(0, (sub.duracao / horasAlocadasEfetivas!) * 100)) : 0

            const duracaoFormatada = `${sub.duracao.toFixed(2).replace('.', ',')}h`
            const alocadoFormatado = temAlocacao
              ? (Number.isInteger(horasAlocadasEfetivas)
                  ? `${horasAlocadasEfetivas}h`
                  : `${horasAlocadasEfetivas!.toString().replace('.', ',')}h`)
              : ''

            const isEditingThisSub = !modoAlocacao && !isBaldeSemSub && editandoSubId === sub.id

            if (isEditingThisSub) {
              return (
                <div key={sub.id} className="flex items-center gap-2 w-full py-1">
                  <input
                    type="text"
                    value={nomeSubEditando}
                    onChange={(e) => setNomeSubEditando(e.target.value)}
                    placeholder="Nome da subcategoria"
                    disabled={salvandoSub}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveEditSub(sub.id!)
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        handleCancelEditSub()
                      }
                    }}
                    className="flex-1 bg-[#0B0E14] border border-gray-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#03A9F4]"
                    autoFocus
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveEditSub(sub.id!)}
                      disabled={!nomeSubEditando.trim() || salvandoSub}
                      className="p-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                      title="Confirmar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditSub}
                      disabled={salvandoSub}
                      className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                      title="Cancelar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={sub.id || 'sem_sub'} className="space-y-1 py-0.5">
                <div className="flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBaldeSemSub ? 'border border-gray-500 bg-transparent' : 'bg-[#03A9F4]'}`} />
                    <span className="text-gray-300 whitespace-normal break-words" title={sub.nome}>{sub.nome}</span>
                    {temAlgumaAlocacao && !temAlocacao && !isBaldeSemSub && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0B0E14] border border-gray-700 text-[#8B949E] shrink-0 font-medium">
                        sem alocação
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {modoAlocacao && !isBaldeSemSub ? (
                      <>
                        <span className="font-mono font-semibold text-white text-right text-xs">
                          {duracaoFormatada}
                        </span>
                        <input
                          type="text"
                          value={alocacoes[sub.id!] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setAlocacoes(prev => ({ ...prev, [sub.id!]: val }))
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
                          className="w-24 bg-[#0B0E14] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#03A9F4]"
                        />
                      </>
                    ) : (
                      <>
                        <span className="font-mono font-semibold text-white text-right">
                          {temAlocacao ? `${duracaoFormatada} / ${alocadoFormatado}` : duracaoFormatada}
                        </span>
                        {!temAlocacao && (
                          <span className="font-mono w-10 text-right font-medium text-[#6B7280]">
                            {sub.percentual ?? 0}%
                          </span>
                        )}
                        {!isBaldeSemSub && (
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditSub(sub)}
                              disabled={salvandoSub || editandoSubId !== null}
                              className="p-1 text-gray-500 hover:text-[#03A9F4] transition-colors disabled:opacity-50"
                              title="Editar subcategoria"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubExcluindoId(sub.id)}
                              disabled={salvandoSub || editandoSubId !== null}
                              className="p-1 text-gray-500 hover:text-[#F44336] transition-colors disabled:opacity-50"
                              title="Excluir subcategoria"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {temAlocacao && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-[#0B0E14] h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${larguraBarra}%`,
                          backgroundColor: excedeu ? '#F44336' : '#03A9F4'
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-[10px] w-10 text-right font-medium shrink-0"
                      style={{ color: excedeu ? '#F44336' : '#6B7280' }}
                    >
                      {percentualAlocado}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {exibirRodape && (
          <div className="mt-3 pt-2 border-t border-gray-800/60 text-[10px] text-[#8B949E] text-right font-mono">
            {somaSemAlocacao.toFixed(2).replace('.', ',')}h sem alocação
          </div>
        )}
      </div>
    )
  }

  const totalLancado = registros.reduce((acc, r) => acc + r.duracao, 0)
  const temFasesComContrato = fases.some(f => f.horas_contratadas !== null && f.horas_contratadas > 0)
  const totalContratadoFases = fases.reduce((acc, f) => acc + (f.horas_contratadas || 0), 0)
  const totalContratado = (fases.length > 0 && temFasesComContrato)
    ? totalContratadoFases
    : (projeto?.horas_contratadas ?? null)

  const temContratado = totalContratado !== null && totalContratado > 0
  const percentualGeral = temContratado ? Math.min(100, Math.round((totalLancado / totalContratado!) * 100)) : 0
  const excedeuContratado = temContratado && totalLancado > totalContratado!
  const diffContratado = temContratado ? Math.abs(totalContratado! - totalLancado) : 0
  const dataMaxima = registros.reduce((max, r) => (r.data > max ? r.data : max), '')
  const ultimaAtividade = dataMaxima ? formatarDataCurta(dataMaxima) : '—'

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        <div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : !projeto ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <h3 className="text-lg font-bold text-white">Projeto não encontrado</h3>
            <button onClick={() => navigate(-1)} className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all">
              Voltar à página anterior
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: projeto.cor }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40"></span>
                  </span>
                  <h1 className="text-2xl font-bold text-white tracking-tight uppercase truncate">{projeto.nome}</h1>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${projeto.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : projeto.status === 'encerrado' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {projeto.status === 'ativo' ? 'Ativo' : projeto.status === 'encerrado' ? 'Encerrado' : 'Excluído'}
                </span>
              </div>
              {projeto.codigo_externo && (
                <div className="font-mono text-xs text-[#8B949E]">
                  Código externo: <span className="text-gray-300 font-semibold">{projeto.codigo_externo}</span>
                </div>
              )}
            </div>

            <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                {temContratado ? (
                  <p className="text-[#8B949E]">
                    <span className="text-white font-bold">{totalLancado.toFixed(2).replace('.', ',')}h</span> lançadas de {totalContratado!.toFixed(2).replace('.', ',')}h contratadas
                  </p>
                ) : (
                  <p className="text-[#8B949E]">
                    <span className="text-white font-bold">{totalLancado.toFixed(2).replace('.', ',')}h</span> lançadas
                  </p>
                )}
                {temContratado && (
                  <span className="font-bold text-sm" style={{ color: excedeuContratado ? '#F44336' : '#4CAF50' }}>{percentualGeral}%</span>
                )}
              </div>
              {temContratado && (
                <div className="w-full bg-[#0B0E14] h-[6px] rounded-full overflow-hidden border border-gray-800/50">
                  <div className="h-full transition-all duration-500" style={{ width: `${percentualGeral}%`, backgroundColor: excedeuContratado ? '#F44336' : '#4CAF50' }} />
                </div>
              )}
              {fases.length === 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDividirEmFases}
                    disabled={salvandoFase}
                    className="text-xs text-[#03A9F4] hover:underline font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    + Dividir em fases
                  </button>
                </div>
              )}
            </div>

            <div className={`grid grid-cols-1 ${temContratado ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-6`}>
              {temContratado && (
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Restantes</span>
                  <p className="text-xl font-mono font-bold" style={{ color: excedeuContratado ? '#F44336' : '#4CAF50' }}>
                    {diffContratado.toFixed(2).replace('.', ',')}h {excedeuContratado ? 'acima' : 'restantes'}
                  </p>
                </div>
              )}
              <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Lançamentos</span>
                <p className="text-xl font-mono font-bold text-white">{registros.length} {registros.length === 1 ? 'registro' : 'registros'}</p>
              </div>
              <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Última atividade</span>
                <p className="text-xl font-mono font-bold text-white">{ultimaAtividade}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Fases & Subcategorias</h2>
                <div className="flex items-center gap-3">
                  {subcategorias.length > 0 && !modoAlocacao && (
                    <button
                      type="button"
                      onClick={handleEntrarModoAlocacao}
                      disabled={salvandoFase || salvandoSub}
                      className="text-xs text-[#03A9F4] hover:underline font-semibold transition-colors disabled:opacity-50"
                    >
                      Alocar horas
                    </button>
                  )}
                  {fases.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddFase}
                      disabled={salvandoFase || salvandoSub}
                      className="text-xs text-[#03A9F4] hover:underline font-semibold transition-colors disabled:opacity-50"
                    >
                      + Adicionar fase
                    </button>
                  )}
                </div>
              </div>
              {fases.length > 0 ? (
                <div className="space-y-4">
                  {fases.map((fase) => {
                    const subsDaFase = subcategorias.filter(s => s.fase_id === fase.id)
                    const setSubIds = new Set(subsDaFase.map(s => s.id))
                    const regsDaFase = registros.filter(r => r.subcategoria_id && setSubIds.has(r.subcategoria_id))
                    const usadoFase = regsDaFase.reduce((acc, r) => acc + r.duracao, 0)
                    const isExpanded = fasesExpandidas[fase.id] ?? false
                    const isEditingThisFase = editandoFaseId === fase.id
                    const subsMapeadas = subsDaFase.map(sub => {
                      const duracao = regsDaFase.filter(r => r.subcategoria_id === sub.id).reduce((acc, r) => acc + r.duracao, 0)
                      return { id: sub.id, nome: sub.nome, duracao, horas_alocadas: sub.horas_alocadas ?? null }
                    })
                    const comDuracao = subsMapeadas.filter(s => s.duracao > 0).sort((a, b) => b.duracao - a.duracao)
                    const semDuracao = subsMapeadas.filter(s => s.duracao === 0).sort((a, b) => a.nome.localeCompare(b.nome))
                    const subcategoriasComPercentual: SubcategoriaBreakdownItem[] = [...comDuracao, ...semDuracao].map(s => ({ ...s, percentual: usadoFase > 0 ? Math.round((s.duracao / usadoFase) * 100) : 0 }))
                    const horasContratadasFormatadas = fase.horas_contratadas !== null && fase.horas_contratadas > 0 ? `${fase.horas_contratadas.toFixed(2).replace('.', ',')}h` : '—'
                    return (
                      <div key={fase.id} className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                        {isEditingThisFase ? (
                          <div className="p-5 flex items-center justify-between gap-3 bg-[#161B22] border-b border-gray-800/60">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                type="text"
                                value={nomeFaseEditando}
                                onChange={(e) => setNomeFaseEditando(e.target.value)}
                                placeholder="Nome da fase"
                                disabled={salvandoFase}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveEditFase(fase.id)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    handleCancelEditFase()
                                  }
                                }}
                                className="flex-1 bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={horasFaseEditando}
                                onChange={(e) => setHorasFaseEditando(e.target.value)}
                                placeholder="Horas"
                                disabled={salvandoFase}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveEditFase(fase.id)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    handleCancelEditFase()
                                  }
                                }}
                                className="w-24 bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#03A9F4]"
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSaveEditFase(fase.id)}
                                disabled={!nomeFaseEditando.trim() || salvandoFase}
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                                title="Confirmar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditFase}
                                disabled={salvandoFase}
                                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between p-5 hover:bg-[#1E2530]/40 transition-colors">
                            <button
                              type="button"
                              onClick={() => toggleFase(fase.id)}
                              disabled={editandoFaseId !== null}
                              className="flex-1 flex items-center justify-between min-w-0 pr-4 text-left focus:outline-none disabled:cursor-default"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="font-bold text-white text-base truncate">{fase.nome}</span>
                              </div>
                              <div className="font-mono text-sm font-semibold text-[#8B949E] shrink-0 ml-2">
                                <span className="text-white font-bold">{usadoFase.toFixed(2).replace('.', ',')}h</span> / {horasContratadasFormatadas}
                              </div>
                            </button>
                            <div className="flex items-center gap-1 shrink-0 border-l border-gray-800/80 pl-3">
                              <button
                                type="button"
                                onClick={() => handleStartEditFase(fase)}
                                disabled={salvandoFase || editandoFaseId !== null}
                                className="p-1 text-gray-500 hover:text-[#03A9F4] transition-colors disabled:opacity-50"
                                title="Editar fase"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleClicarExcluirFase(fase)}
                                disabled={salvandoFase || editandoFaseId !== null}
                                className="p-1 text-gray-500 hover:text-[#F44336] transition-colors disabled:opacity-50"
                                title="Excluir fase"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0'}`}>
                          {renderListaSubcategorias(subcategoriasComPercentual)}

                          {!modoAlocacao && (
                            adicionandoEmFaseId === fase.id ? (
                              <div className="flex items-center gap-2 mt-3">
                                <input
                                  type="text"
                                  placeholder="Nova subcategoria..."
                                  value={novaSubNome}
                                  onChange={(e) => setNovaSubNome(e.target.value)}
                                  disabled={salvandoSub}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleConfirmAddSubcategoria(fase.id)
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault()
                                      setAdicionandoEmFaseId(null)
                                      setNovaSubNome('')
                                    }
                                  }}
                                  className="flex-1 bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#03A9F4]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAddSubcategoria(fase.id)}
                                  disabled={!novaSubNome.trim() || salvandoSub}
                                  className="bg-[#03A9F4] hover:bg-[#0288D1] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                  Adicionar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdicionandoEmFaseId(null)
                                    setNovaSubNome('')
                                  }}
                                  disabled={salvandoSub}
                                  className="text-gray-500 hover:text-gray-300 p-1 text-xs transition-colors"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdicionandoEmFaseId(fase.id)
                                  setNovaSubNome('')
                                }}
                                disabled={salvandoSub}
                                className="text-xs text-[#03A9F4] hover:underline font-semibold transition-colors mt-3 block"
                              >
                                + adicionar subcategoria
                              </button>
                            )
                          )}

                          {fase.horas_contratadas !== null && fase.horas_contratadas !== undefined && (() => {
                            const alocadoFase = modoAlocacao
                              ? subsDaFase.reduce((acc, sub) => {
                                  const rawVal = alocacoes[sub.id] ?? ''
                                  let val = 0
                                  if (rawVal.trim()) {
                                    const parsed = parseFloat(rawVal.replace(',', '.'))
                                    if (!isNaN(parsed)) val = parsed
                                  }
                                  return acc + val
                                }, 0)
                              : subsDaFase.reduce((acc, sub) => acc + (sub.horas_alocadas || 0), 0)

                            const diffFase = Math.round((fase.horas_contratadas - alocadoFase) * 100) / 100
                            if (diffFase > 0) {
                              return (
                                <div className="rounded-lg px-3 py-2 mt-3 text-xs border-l-[3px] border-l-[#FFC107] bg-[rgba(255,193,7,0.1)] text-[#FFC107] flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Faltam {formatarHoras(diffFase)}h para alocar nesta fase</span>
                                </div>
                              )
                            } else if (diffFase < 0) {
                              return (
                                <div className="rounded-lg px-3 py-2 mt-3 text-xs border-l-[3px] border-l-[#F44336] bg-[rgba(244,67,54,0.1)] text-[#F44336] flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span>{formatarHoras(Math.abs(diffFase))}h acima das horas da fase</span>
                                </div>
                              )
                            } else {
                              return (
                                <div className="rounded-lg px-3 py-2 mt-3 text-xs border-l-[3px] border-l-[#4CAF50] bg-[rgba(76,175,80,0.1)] text-[#4CAF50] flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Totalmente alocado</span>
                                </div>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    )
                  })}

                  {/* Restauração do Bloco Sem Fase para registros e subcategorias órfãs */}
                  {(() => {
                    const idsSubsComFase = new Set(subcategorias.filter(s => s.fase_id).map(s => s.id))
                    const regsSemFase = registros.filter(r => !r.subcategoria_id || !idsSubsComFase.has(r.subcategoria_id))
                    const duracaoSemFase = regsSemFase.reduce((acc, r) => acc + r.duracao, 0)
                    const subsSemFase = subcategorias.filter(s => !s.fase_id)

                    if (duracaoSemFase === 0 && subsSemFase.length === 0) return null

                    const subIdsSemFaseSet = new Set(subsSemFase.map(s => s.id))
                    const semSubDuracaoFase = regsSemFase
                      .filter(r => !r.subcategoria_id || !subIdsSemFaseSet.has(r.subcategoria_id))
                      .reduce((acc, r) => acc + r.duracao, 0)

                    const subsMapeadas = subsSemFase.map(sub => {
                      const duracao = regsSemFase.filter(r => r.subcategoria_id === sub.id).reduce((acc, r) => acc + r.duracao, 0)
                      return { id: sub.id, nome: sub.nome, duracao, horas_alocadas: sub.horas_alocadas ?? null }
                    })
                    const comDuracao = subsMapeadas.filter(s => s.duracao > 0).sort((a, b) => b.duracao - a.duracao)
                    const semDuracao = subsMapeadas.filter(s => s.duracao === 0).sort((a, b) => a.nome.localeCompare(b.nome))
                    const subcategoriasComPercentual: SubcategoriaBreakdownItem[] = [...comDuracao, ...semDuracao].map(s => ({
                      ...s,
                      percentual: duracaoSemFase > 0 ? Math.round((s.duracao / duracaoSemFase) * 100) : 0
                    }))

                    if (semSubDuracaoFase > 0) {
                      subcategoriasComPercentual.push({
                        id: null,
                        nome: 'Sem subcategoria',
                        duracao: semSubDuracaoFase,
                        horas_alocadas: null,
                        percentual: duracaoSemFase > 0 ? Math.round((semSubDuracaoFase / duracaoSemFase) * 100) : 0
                      })
                    }

                    return (
                      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-base">Sem fase</span>
                          <div className="font-mono text-sm font-semibold text-[#8B949E]">
                            <span className="text-white font-bold">{duracaoSemFase.toFixed(2).replace('.', ',')}h</span> / —
                          </div>
                        </div>
                        {renderListaSubcategorias(subcategoriasComPercentual)}
                      </div>
                    )
                  })()}

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirmandoRemoverDivisao(true)}
                      disabled={salvandoFase}
                      className="text-xs text-[#F44336] hover:underline font-semibold transition-colors disabled:opacity-50"
                    >
                      Remover divisão em fases
                    </button>
                  </div>
                </div>
              ) : (
                /* PROJETO SEM FASES */
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 space-y-3">
                  {(() => {
                    const subIdsCadastradas = new Set(subcategorias.map(s => s.id))
                    const duracaoSemSub = registros
                      .filter(r => !r.subcategoria_id || !subIdsCadastradas.has(r.subcategoria_id))
                      .reduce((acc, r) => acc + r.duracao, 0)

                    const subsMapeadas = subcategorias.map(sub => {
                      const duracao = registros
                        .filter(r => r.subcategoria_id === sub.id)
                        .reduce((acc, r) => acc + r.duracao, 0)
                      return {
                        id: sub.id,
                        nome: sub.nome,
                        duracao,
                        horas_alocadas: sub.horas_alocadas ?? null
                      }
                    })

                    const comDuracao = subsMapeadas
                      .filter(s => s.duracao > 0)
                      .sort((a, b) => b.duracao - a.duracao)

                    const semDuracao = subsMapeadas
                      .filter(s => s.duracao === 0)
                      .sort((a, b) => a.nome.localeCompare(b.nome))

                    const subcategoriasComPercentual: SubcategoriaBreakdownItem[] = [...comDuracao, ...semDuracao].map(s => ({
                      ...s,
                      percentual: totalLancado > 0
                        ? Math.round((s.duracao / totalLancado) * 100)
                        : 0
                    }))

                    if (duracaoSemSub > 0) {
                      subcategoriasComPercentual.push({
                        id: null,
                        nome: 'Sem subcategoria',
                        duracao: duracaoSemSub,
                        horas_alocadas: null,
                        percentual: totalLancado > 0 ? Math.round((duracaoSemSub / totalLancado) * 100) : 0
                      })
                    }

                    return renderListaSubcategorias(subcategoriasComPercentual)
                  })()}

                  {!modoAlocacao && (
                    adicionandoSemFase ? (
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Nova subcategoria..."
                          value={novaSubNome}
                          onChange={(e) => setNovaSubNome(e.target.value)}
                          disabled={salvandoSub}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleConfirmAddSubcategoria(null)
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              setAdicionandoSemFase(false)
                              setNovaSubNome('')
                            }
                          }}
                          className="flex-1 bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#03A9F4]"
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmAddSubcategoria(null)}
                          disabled={!novaSubNome.trim() || salvandoSub}
                          className="bg-[#03A9F4] hover:bg-[#0288D1] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Adicionar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdicionandoSemFase(false)
                            setNovaSubNome('')
                          }}
                          disabled={salvandoSub}
                          className="text-gray-500 hover:text-gray-300 p-1 text-xs transition-colors"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAdicionandoSemFase(true)
                          setNovaSubNome('')
                        }}
                        disabled={salvandoSub}
                        className="text-xs text-[#03A9F4] hover:underline font-semibold transition-colors mt-3 block"
                      >
                        + adicionar subcategoria
                      </button>
                    )
                  )}

                  {projeto.horas_contratadas !== null && projeto.horas_contratadas > 0 && subcategorias.length > 0 && (() => {
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

                    const diff = Math.round((projeto.horas_contratadas - somaAlocada) * 100) / 100
                    if (diff > 0) {
                      return (
                        <div className="rounded-lg px-3 py-2 mt-3 text-xs border-l-[3px] border-l-[#FFC107] bg-[rgba(255,193,7,0.1)] text-[#FFC107] flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Faltam {formatarHoras(diff)}h para alocar nas subcategorias</span>
                        </div>
                      )
                    } else if (diff < 0) {
                      return (
                        <div className="rounded-lg px-3 py-2 mt-3 text-xs border-l-[3px] border-l-[#F44336] bg-[rgba(244,67,54,0.1)] text-[#F44336] flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>{formatarHoras(Math.abs(diff))}h acima do contratado</span>
                        </div>
                      )
                    } else {
                      return (
                        <div className="rounded-lg px-3 py-2 mt-3 text-xs border-l-[3px] border-l-[#4CAF50] bg-[rgba(76,175,80,0.1)] text-[#4CAF50] flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Totalmente alocado</span>
                        </div>
                      )
                    }
                  })()}
                </div>
              )}

              {modoAlocacao && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-gray-800/60">
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

            <div className="space-y-4 pt-2">
              <div>
                <h2 className="text-xl font-bold text-white">Lançamentos</h2>
                <p className="text-xs text-[#8B949E] mt-1">Clique para editar · use o olho para ver o dia completo em Registros</p>
              </div>
              {registrosPorSemana.length === 0 ? (
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-8 text-center">
                  <p className="text-sm text-[#8B949E]">Nenhum lançamento neste projeto.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrosPorSemana.map((grupo, idx) => {
                    const isFirst = idx === 0
                    const isExpanded = semanasExpandidas[grupo.semanaInicio] !== undefined ? semanasExpandidas[grupo.semanaInicio] : isFirst
                    return (
                      <div key={grupo.semanaInicio} className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                        <button type="button" onClick={() => toggleSemana(grupo.semanaInicio, isFirst)} className="w-full flex items-center justify-between p-5 hover:bg-[#1E2530]/40 transition-colors focus:outline-none">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="font-bold text-white text-base truncate">{formatarSemanaLabel(grupo.semanaInicio)}</span>
                          </div>
                          <div className="font-mono text-sm font-semibold text-white">{grupo.totalHoras.toFixed(2).replace('.', ',')}h</div>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[3000px] opacity-100 p-5 pt-0 border-t border-gray-800/60' : 'max-h-0 opacity-0'}`}>
                          <div className="flex flex-col gap-2 pt-3">
                            {grupo.registros.map((reg) => {
                              const nomeSub = reg.subcategoria?.nome || subcategorias.find(s => s.id === reg.subcategoria_id)?.nome
                              return (
                                <div key={reg.id} onClick={() => abrirEditarRegistro(reg)} className="p-4 rounded-xl bg-[#0B0E14]/60 hover:bg-[#1E2530]/60 border border-gray-800/80 transition-colors cursor-pointer flex flex-col gap-2 group">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                                      <span className="font-mono text-xs text-[#8B949E] shrink-0">{formatarDataCurta(reg.data)}</span>
                                      <span className="text-xs text-gray-300 font-mono shrink-0">{reg.hora_inicio.slice(0, 5)}–{reg.hora_fim.slice(0, 5)}</span>
                                      {nomeSub && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0E14] border border-gray-700 text-[#8B949E] font-medium truncate max-w-[150px] sm:max-w-[200px]">{nomeSub}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="font-mono text-sm font-bold text-[#03A9F4]">
                                        {reg.duracao.toFixed(2).replace('.', ',')}h
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const targetUrl = reg.projeto_id
                                            ? `/registros?data=${reg.data}&projeto_id=${reg.projeto_id}`
                                            : `/registros?data=${reg.data}`
                                          navigate(targetUrl)
                                        }}
                                        className="p-1 text-gray-500 hover:text-[#03A9F4] transition-colors focus:outline-none"
                                        title="Ver no dia"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                          />
                                        </svg>
                                      </button>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-gray-500 hover:text-[#03A9F4] transition-colors"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  {reg.observacao && <p className="text-xs text-[#8B949E] break-words leading-relaxed">{reg.observacao}</p>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <ModalRegistro
              isOpen={isModalRegistroOpen}
              onClose={fecharModalRegistro}
              onSave={handleSalvarRegistro}
              registro={editingRegistro}
              registrosExistentes={todosRegistros}
            />

            <ModalConfirmacao
              isOpen={subExcluindoId !== null}
              titulo="Excluir Subcategoria"
              mensagem="Excluir subcategoria? Os lançamentos vinculados são mantidos e passam a aparecer como 'Sem subcategoria'."
              perigo={true}
              textoConfirmar="Excluir"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarExclusaoSub}
              onCancelar={() => setSubExcluindoId(null)}
            />

            <ModalConfirmacao
              isOpen={faseExcluindoId !== null}
              titulo="Excluir Fase"
              mensagem="Excluir esta fase? Ela não tem subcategorias vinculadas."
              perigo={true}
              textoConfirmar="Excluir"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarExclusaoFase}
              onCancelar={() => setFaseExcluindoId(null)}
            />

            <ModalConfirmacao
              isOpen={confirmandoRemoverDivisao}
              titulo="Remover divisão em fases"
              mensagem="Todas as fases serão excluídas e o projeto volta ao modo simples. As subcategorias, os lançamentos e as horas contratadas são mantidos."
              perigo={true}
              textoConfirmar="Remover"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarRemoverDivisao}
              onCancelar={() => setConfirmandoRemoverDivisao(false)}
            />

            {faseComSubsExcluindo && (() => {
              const faseAlvo = fases.find(f => f.id === faseComSubsExcluindo.faseId)
              if (!faseAlvo) return null

              const subsDaFase = subcategorias.filter(s => s.fase_id === faseAlvo.id)
              const outrasFases = fases
                .filter(f => f.id !== faseAlvo.id)
                .sort((a, b) => a.ordem - b.ordem)

              return (
                <div
                  className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => { if (!salvandoFase) setFaseComSubsExcluindo(null) }}
                >
                  <div
                    className="bg-[#161B22] border border-gray-800 rounded-2xl w-[95%] sm:w-full max-w-sm p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setFaseComSubsExcluindo(null)}
                      disabled={salvandoFase}
                      type="button"
                      className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <h3 className="text-xl font-bold text-white mb-2 shrink-0">
                      Excluir fase
                    </h3>

                    <p className="text-sm text-gray-400 mb-4">
                      Esta fase tem {subsDaFase.length} subcategoria(s). Escolha o que fazer com elas — nenhum lançamento será perdido.
                    </p>

                    <div className="mb-6 space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">Destino das subcategorias</label>
                      <select
                        value={faseComSubsExcluindo.destinoFaseId}
                        onChange={(e) => setFaseComSubsExcluindo(prev => prev ? { ...prev, destinoFaseId: e.target.value } : null)}
                        disabled={salvandoFase}
                        className="w-full bg-[#0B0E14] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#03A9F4] disabled:opacity-50"
                      >
                        {outrasFases.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.nome}
                          </option>
                        ))}
                        <option value="">Deixar sem fase</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFaseComSubsExcluindo(null)}
                        disabled={salvandoFase}
                        className="w-full sm:flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all border border-gray-700 focus:outline-none disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmarExclusaoFaseComSubs(faseAlvo.id, faseComSubsExcluindo.destinoFaseId)}
                        disabled={salvandoFase}
                        className="w-full sm:flex-1 py-3 px-4 bg-[#F44336] hover:bg-red-600 active:bg-red-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50"
                      >
                        {salvandoFase ? 'Excluindo...' : 'Excluir fase'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </main>
    </div>
  )
}
