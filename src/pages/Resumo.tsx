import { useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useConfig } from '../contexts/ConfigContext'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import BreakdownSubcategorias from '../components/BreakdownSubcategorias'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { listarRegistros } from '../services/registros'
import { listarProjetos, arquivarProjeto, desarquivarProjeto, excluirPermanentemente, atualizarOrdemResumo } from '../services/projetos'
import { buscarHorasBaseSemanal } from '../services/horas_base'
import { subcategoriasService } from '../services/subcategorias'
import { getErrorMessage } from '../utils/errors'
import type { Registro, Projeto, Subcategoria } from '../types'
import { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../contexts/ToastContext'
import { inicioDaSemana, type InicioSemana } from '../utils/semana'
import { AlertTriangle, ChartNoAxesColumn, ChevronDown, GripVertical, LayoutGrid, List, Table2 } from 'lucide-react'
import { Button, Chip, EmptyState, Secao, Surface } from '../components/ui'

type Aba = 'semanal' | 'diario' | 'projetos'

function getSemanaInicioParaData(dataStr: string, inicio: InicioSemana): string {
  return inicioDaSemana(dataStr, inicio)
}

interface ProjetoCardSortableProps {
  id: string
  children: ReactNode
}

function ProjetoCardSortable({ id, children }: ProjetoCardSortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    position: 'relative' as const,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined
  }

  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-500 hover:text-ink-900 cursor-grab active:cursor-grabbing touch-none rounded-ctl bg-surface-0/70 backdrop-blur-sm transition-colors duration-d1 ease-ez"
        title="Arrastar para reordenar"
      >
        <GripVertical className="w-icon-md h-icon-md" />
      </button>
      {children}
    </div>
  )
}

export default function Resumo() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { config } = useConfig()

  const [registros, setRegistros] = useState<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; status: 'ativo' | 'encerrado' | 'excluido'; nome_original: string | null } | null })[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [subcategoriasCadastradas, setSubcategoriasCadastradas] = useState<Subcategoria[]>([])
  const [horasBasePorSemana, setHorasBasePorSemana] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [abaAtiva, setAbaAtiva] = useState<Aba>('projetos')
  const [rotinasExpandidas, setRotinasExpandidas] = useState<{ [key: string]: boolean }>({})
  const [projetosExpandidos, setProjetosExpandidos] = useState<{ [key: string]: boolean }>({})
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [apenasBillable, setApenasBillable] = useState(true)
  const [apenasComCodigo, setApenasComCodigo] = useState(false)
  const [projetoParaExcluir, setProjetoParaExcluir] = useState<{ id: string, nome: string } | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'lista' | 'tabela'>(() => {
    return (localStorage.getItem('horas_view_resumo') as 'cards' | 'lista' | 'tabela') || 'cards'
  })

  const changeViewMode = (mode: 'cards' | 'lista' | 'tabela') => {
    setViewMode(mode)
    localStorage.setItem('horas_view_resumo', mode)
  }

  const handleArquivar = async (id: string) => {
    try {
      await arquivarProjeto(id)
      await carregarDados()
      showToast('Projeto arquivado!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleDesarquivar = async (id: string) => {
    try {
      await desarquivarProjeto(id)
      await carregarDados()
      showToast('Projeto desarquivado!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleConfirmarExclusaoPermanente = async () => {
    if (!projetoParaExcluir) return
    try {
      await excluirPermanentemente(projetoParaExcluir.id)
      await carregarDados()
      showToast('Projeto e lançamentos excluídos permanentemente!', 'success')
      setProjetoParaExcluir(null)
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    }
  }
  const toggleRotina = (id: string) => {
    setRotinasExpandidas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleProjeto = (id: string) => {
    setProjetosExpandidos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Carregar dados
  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const [projs, regs, subs] = await Promise.all([
        listarProjetos(user.id),
        listarRegistros(user.id),
        subcategoriasService.listarTodasSubcategorias(user.id)
      ])

      setProjetos(projs)
      setRegistros(regs)
      setSubcategoriasCadastradas(subs)

      // Extrair semanas únicas e buscar horas base para cada uma
      const semanasUnicas = [...new Set(regs.map(r => r.semana_inicio).filter(Boolean))] as string[]
      const basePromises = semanasUnicas.map(async (semana) => {
        const hBase = await buscarHorasBaseSemanal(user.id, semana)
        return { semana, hBase }
      })
      const baseResults = await Promise.all(basePromises)
      const record: Record<string, number> = {}
      baseResults.forEach(({ semana, hBase }) => {
        record[semana] = hBase
      })
      setHorasBasePorSemana(record)
    } catch (err: any) {
      console.error('Erro ao carregar dados do resumo:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user])

  // ============================
  // Helpers de Formatação
  // ============================
  const formatarTituloSemana = (semanaInicio: string) => {
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const [y, m, d] = semanaInicio.split('-').map(Number)
    const inicio = new Date(y, m - 1, d)
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)

    const d1 = inicio.getDate()
    const m1 = meses[inicio.getMonth()]
    const d2 = fim.getDate()
    const m2 = meses[fim.getMonth()]
    const ano = fim.getFullYear()

    if (inicio.getMonth() === fim.getMonth()) {
      return `${String(d1).padStart(2, '0')} a ${String(d2).padStart(2, '0')} ${m1} (${ano})`
    } else {
      return `${String(d1).padStart(2, '0')} ${m1} a ${String(d2).padStart(2, '0')} ${m2} (${ano})`
    }
  }

  const formatarTituloData = (dataStr: string) => {
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const [ry, rm, rd] = dataStr.split('-').map(Number)
    const dataDate = new Date(ry, rm - 1, rd)
    return `${diasSemana[dataDate.getDay()]}, ${String(rd).padStart(2, '0')} de ${mesesAbrev[rm - 1]} (${ry})`
  }

  const formatarDataCurta = (dataStr: string) => {
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const [, rm, rd] = dataStr.split('-').map(Number)
    return `${String(rd).padStart(2, '0')} ${mesesAbrev[rm - 1]}`
  }

  // ============================
  // Agrupamentos
  // ============================

  const idsProjetosComCodigo = useMemo(() => {
    return new Set(
      projetos
        .filter(p => p.codigo_externo && p.codigo_externo.trim() !== '')
        .map(p => p.id)
    )
  }, [projetos])

  const registrosParaResumo = useMemo(() => {
    if (!apenasComCodigo) return registros
    return registros.filter(r => r.projeto_id && idsProjetosComCodigo.has(r.projeto_id))
  }, [registros, apenasComCodigo, idsProjetosComCodigo])

  // 1. Semanal
  const resumoSemanas = useMemo(() => {
    const grupos: { [key: string]: number } = {}
    registrosParaResumo.forEach((reg) => {
      if (!reg.semana_inicio) return
      grupos[reg.semana_inicio] = (grupos[reg.semana_inicio] || 0) + reg.duracao
    })
    return Object.keys(grupos)
      .sort((a, b) => a.localeCompare(b))
      .map((semana) => {
        const totalHoras = grupos[semana]
        const baseVigente = horasBasePorSemana[semana] ?? config.meta_semanal
        const atingiuMeta = totalHoras >= baseVigente
        const percentual = Math.min(100, Math.round((totalHoras / baseVigente) * 100))
        const diferenca = totalHoras - baseVigente
        return {
          semana_inicio: semana,
          titulo: formatarTituloSemana(semana),
          totalHoras,
          atingiuMeta,
          percentual,
          diferenca,
          metaVigente: baseVigente
        }
      })
  }, [registrosParaResumo, config.meta_semanal, horasBasePorSemana, config.inicio_semana])

  // 2. Diário
  const resumoDias = useMemo(() => {
    const grupos: { [key: string]: number } = {}
    registrosParaResumo.forEach((reg) => {
      grupos[reg.data] = (grupos[reg.data] || 0) + reg.duracao
    })
    return Object.keys(grupos)
      .sort((a, b) => a.localeCompare(b))
      .map((data) => {
        const totalHoras = grupos[data]
        const semanaDodia = getSemanaInicioParaData(data, config.inicio_semana)
        const baseVigente = horasBasePorSemana[semanaDodia] ?? config.meta_semanal
        const metaDiariaVigente = baseVigente / 5
        const atingiuMeta = totalHoras >= metaDiariaVigente
        const percentual = Math.min(100, Math.round((totalHoras / metaDiariaVigente) * 100))
        const diferenca = totalHoras - metaDiariaVigente
        return { data, titulo: formatarTituloData(data), totalHoras, atingiuMeta, percentual, diferenca, metaDiariaVigente }
      })
  }, [registrosParaResumo, config.meta_semanal, horasBasePorSemana, config.inicio_semana])

  // 3. Projetos
  const resumoProjetos = useMemo(() => {
    const grupos: { [key: string]: { duracao: number, qtd: number, registros: any[] } } = {}
    let totalGeral = 0
    registros.forEach((reg) => {
      const projId = reg.projeto_id || 'sem_projeto'
      if (!grupos[projId]) grupos[projId] = { duracao: 0, qtd: 0, registros: [] }
      grupos[projId].duracao += reg.duracao
      grupos[projId].qtd += 1
      grupos[projId].registros.push(reg)
      totalGeral += reg.duracao
    })

    const arrayProjetos: any[] = []
    const arrayRotina: any[] = []

    Object.keys(grupos).forEach(id => {
      let nome = 'Sem Projeto'
      let cor = '#6B7280'
      let tipo = 'projeto'
      let horas_contratadas = null
      let status = 'ativo'
      let arquivado = false
      let nome_original = null
      let billable: boolean | null = false
      let ordem_resumo: number | null = null

      if (id !== 'sem_projeto') {
        const p = projetos.find(p => p.id === id)
        if (p) {
          nome = p.nome
          cor = p.cor
          tipo = p.tipo || 'projeto'
          horas_contratadas = p.horas_contratadas
          status = p.status
          arquivado = p.arquivado
          billable = p.billable
          nome_original = p.nome_original
          ordem_resumo = p.ordem_resumo
        }
      }

      const totalHoras = grupos[id].duracao
      const qtd = grupos[id].qtd
      // Ordenar os registros pela data e hora de inicio (mais recente primeiro)
      const regs = grupos[id].registros.sort((a, b) => {
        if (a.data === b.data) return b.hora_inicio.localeCompare(a.hora_inicio)
        return b.data.localeCompare(a.data)
      })

      // Breakdown de Subcategorias
      const subsCadastradasDoProjeto = subcategoriasCadastradas.filter(s => s.projeto_id === id)
      const subIdsCadastradas = new Set(subsCadastradasDoProjeto.map(s => s.id))

      const subsMapeadas = subsCadastradasDoProjeto.map(sub => {
        const duracao = regs
          .filter(r => r.subcategoria_id === sub.id)
          .reduce((acc, r) => acc + r.duracao, 0)

        return {
          id: sub.id,
          nome: sub.nome,
          duracao,
          horas_alocadas: sub.horas_alocadas ?? null
        }
      })

      const duracaoSemSub = regs
        .filter(r => !r.subcategoria_id || !subIdsCadastradas.has(r.subcategoria_id))
        .reduce((acc, r) => acc + r.duracao, 0)

      const comDuracao = subsMapeadas
        .filter(s => s.duracao > 0)
        .sort((a, b) => b.duracao - a.duracao)

      const semDuracao = subsMapeadas
        .filter(s => s.duracao === 0)
        .sort((a, b) => a.nome.localeCompare(b.nome))

      const listaSubcategorias: Array<{
        id: string | null
        nome: string
        duracao: number
        horas_alocadas: number | null
      }> = [...comDuracao, ...semDuracao]

      if (duracaoSemSub > 0) {
        listaSubcategorias.push({
          id: null,
          nome: 'Sem subcategoria',
          duracao: duracaoSemSub,
          horas_alocadas: null
        })
      }

      const subcategorias = listaSubcategorias.map(s => ({
        ...s,
        percentual: totalHoras > 0 ? Math.round((s.duracao / totalHoras) * 100) : 0
      }))

      const item = { id, nome, cor, totalHoras, qtd, horas_contratadas, registros: regs, subcategorias, status, arquivado, nome_original, billable, ordem_resumo }

      if (tipo === 'rotina') {
        arrayRotina.push(item)
      } else {
        arrayProjetos.push(item)
      }
    })

    return {
      totalGeral,
      projetos: arrayProjetos.sort((a, b) => b.totalHoras - a.totalHoras),
      rotinas: arrayRotina.sort((a, b) => b.totalHoras - a.totalHoras)
    }
  }, [registros, projetos, subcategoriasCadastradas])

  const projetosVisiveis = useMemo(
    () => apenasBillable
      ? resumoProjetos.projetos.filter(p => p.billable === true)
      : resumoProjetos.projetos,
    [resumoProjetos.projetos, apenasBillable]
  )

  const ativosOrdenados = useMemo(() => {
    const ativos = projetosVisiveis.filter(p => p.status === 'ativo' && !p.arquivado)
    return [...ativos].sort((a, b) => {
      if (a.ordem_resumo !== null && a.ordem_resumo !== undefined && b.ordem_resumo !== null && b.ordem_resumo !== undefined) {
        if (a.ordem_resumo !== b.ordem_resumo) return a.ordem_resumo - b.ordem_resumo
        return a.nome.localeCompare(b.nome)
      }
      if ((a.ordem_resumo !== null && a.ordem_resumo !== undefined) && (b.ordem_resumo === null || b.ordem_resumo === undefined)) return -1
      if ((a.ordem_resumo === null || a.ordem_resumo === undefined) && (b.ordem_resumo !== null && b.ordem_resumo !== undefined)) return 1
      return a.nome.localeCompare(b.nome)
    })
  }, [projetosVisiveis])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6
      }
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ativosOrdenados.findIndex(p => p.id === active.id)
    const newIndex = ativosOrdenados.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedAtivos = arrayMove(ativosOrdenados, oldIndex, newIndex)
    const atualizacoesOrdem = reorderedAtivos.map((proj, idx) => ({
      id: proj.id,
      ordem_resumo: idx + 1
    }))

    const ordemMap = new Map(atualizacoesOrdem.map(u => [u.id, u.ordem_resumo]))
    const projetosAntigos = [...projetos]

    setProjetos(prev =>
      prev.map(p => {
        if (ordemMap.has(p.id)) {
          return { ...p, ordem_resumo: ordemMap.get(p.id)! }
        }
        return p
      })
    )

    try {
      await atualizarOrdemResumo(atualizacoesOrdem)
    } catch (err: any) {
      console.error('Erro ao atualizar ordem do resumo:', err)
      setProjetos(projetosAntigos)
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">

      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Painel de Resumos</h1>
          <p className="text-sm text-ink-500">Analise suas horas lançadas sob diferentes perspectivas.</p>
        </div>

        {error && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
            className="p-4 bg-bad-bg border rounded-card text-bad text-sm flex items-center gap-md"
          >
            <AlertTriangle className="w-icon-md h-icon-md shrink-0 text-bad" />
            <span className="font-ui">{error}</span>
          </div>
        )}

        {/* Sistema de Abas e Toggle de Visualização */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-lg">
          <div className="flex p-0.5 sm:p-1 bg-surface-1 border border-hair rounded-ctl w-fit">
            <button
              onClick={() => setAbaAtiva('semanal')}
              className={`px-ctl-aba-x py-ctl-aba-y sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${abaAtiva === 'semanal' ? 'bg-accent-bg text-accent-fg' : 'text-ink-500 hover:text-ink-900'
                }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setAbaAtiva('diario')}
              className={`px-ctl-aba-x py-ctl-aba-y sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${abaAtiva === 'diario' ? 'bg-accent-bg text-accent-fg' : 'text-ink-500 hover:text-ink-900'
                }`}
            >
              Diário
            </button>
            <button
              onClick={() => setAbaAtiva('projetos')}
              className={`px-ctl-aba-x py-ctl-aba-y sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${abaAtiva === 'projetos' ? 'bg-accent-bg text-accent-fg' : 'text-ink-500 hover:text-ink-900'
                }`}
            >
              Por Projetos
            </button>
          </div>

          {(abaAtiva === 'semanal' || abaAtiva === 'diario') && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
              <button
                type="button"
                onClick={() => setApenasComCodigo(v => !v)}
                className="flex items-center gap-sm text-sm font-semibold text-ink-700 hover:text-ink-900 transition-colors duration-d1 ease-ez py-2 min-h-[44px]"
              >
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-d1 ease-ez ${apenasComCodigo ? 'bg-accent' : 'bg-surface-3'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-d1 ease-ez ${apenasComCodigo ? 'translate-x-4' : 'translate-x-1'
                      }`}
                  />
                </span>
                Apenas com código
              </button>
              <div className="flex bg-surface-1 p-1 rounded-ctl border border-hair">
                <button
                  onClick={() => changeViewMode('cards')}
                  className={`flex items-center gap-xs px-ctl-aba-x py-ctl-aba-y min-h-[44px] rounded-ctl text-xs font-semibold transition-colors duration-d1 ease-ez ${viewMode === 'cards'
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
                    }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-icon-sm h-icon-sm shrink-0" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => changeViewMode('lista')}
                  className={`flex items-center gap-xs px-ctl-aba-x py-ctl-aba-y min-h-[44px] rounded-ctl text-xs font-semibold transition-colors duration-d1 ease-ez ${viewMode === 'lista'
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
                    }`}
                  title="Visualização em Lista"
                >
                  <List className="w-icon-sm h-icon-sm shrink-0" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => changeViewMode('tabela')}
                  className={`flex items-center gap-xs px-ctl-aba-x py-ctl-aba-y min-h-[44px] rounded-ctl text-xs font-semibold transition-colors duration-d1 ease-ez ${viewMode === 'tabela'
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
                    }`}
                  title="Visualização em Tabela"
                >
                  <Table2 className="w-icon-sm h-icon-sm shrink-0" />
                  <span>Tabela</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : registros.length === 0 ? (
          <Surface elevacao={1} comBorda padding="nenhum" className="p-12 text-center max-w-lg mx-auto space-y-4">
            <EmptyState
              icone={<ChartNoAxesColumn className="w-icon-xl h-icon-xl" />}
              corIcone="text-accent"
              corFundoIcone="bg-surface-2"
              titulo="Nenhum histórico encontrado"
              descricao="Você ainda não registrou nenhuma hora. Seus dados consolidados aparecerão aqui assim que fizer seus primeiros lançamentos."
              variante="display"
              acao={
                <Link
                  to="/registros"
                  className="inline-block py-2.5 px-4 bg-surface-2 hover:bg-surface-3 border border-hair-strong text-ink-900 text-xs font-semibold rounded-ctl transition-colors duration-d1 ease-ez"
                >
                  Ir para Lançamentos
                </Link>
              }
            />
          </Surface>
        ) : (
          <div className="space-y-6">

            {/* =========================================================================
                ABA: SEMANAL 
               ========================================================================= */}
            {abaAtiva === 'semanal' && (
              <div>
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                    {resumoSemanas.map((semana) => {
                      const valorDiferenca = semana.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`

                      return (
                        <Surface
                          key={semana.semana_inicio}
                          elevacao={1}
                          comBorda
                          padding="nenhum"
                          className="p-6 space-y-5 flex flex-col justify-between hover:border-hair-strong transition-colors duration-d1 ease-ez"
                        >
                          {/* Cabeçalho */}
                          <div className="flex justify-between items-start gap-lg">
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 block mb-1">Período</span>
                              <h3 className="text-base font-display font-bold text-ink-900 leading-snug">{semana.titulo}</h3>
                            </div>
                            <div className="shrink-0">
                              <Chip tom={semana.atingiuMeta ? 'ok' : 'erro'}>
                                {semana.atingiuMeta ? 'Atingida' : 'Pendente'}
                              </Chip>
                            </div>
                          </div>

                          {/* Dados */}
                          <div className="grid grid-cols-3 gap-lg py-2 border-y border-hair">
                            <div>
                              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block mb-1 font-ui">Trabalhado</span>
                              <span className="text-lg font-mono font-bold text-ink-900 tabular-nums">{semana.totalHoras.toFixed(2).replace('.', ',')}h</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block mb-1 font-ui">Meta</span>
                              <span className="text-lg font-mono font-bold text-ink-700 tabular-nums">{semana.metaVigente.toFixed(2).replace('.', ',')}h</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block mb-1 font-ui">Restante</span>
                              <span className="text-lg font-mono font-bold tabular-nums" style={{ color: isPositivoOuZero ? 'var(--ok)' : 'var(--bad)' }}>{diferencaTexto}</span>
                            </div>
                          </div>

                          {/* Progresso */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-ink-500">Progresso</span>
                              <span style={{ color: semana.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}>{semana.percentual}% Concluído</span>
                            </div>
                            <div className="w-full bg-surface-0 h-3 rounded-full overflow-hidden border border-hair">
                              <div
                                className="h-full rounded-full transition-[width,background-color] duration-d2 ease-ez"
                                style={{ width: `${semana.percentual}%`, backgroundColor: semana.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}
                              />
                            </div>
                          </div>
                        </Surface>
                      )
                    })}
                  </div>
                )}

                {viewMode === 'lista' && (
                  <Surface elevacao={1} comBorda padding="nenhum" className="flex flex-col gap-sm p-4 divide-y divide-hair">
                    {resumoSemanas.map((semana) => {
                      const valorDiferenca = semana.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                      return (
                        <div key={semana.semana_inicio} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 first:pt-0 last:pb-0 gap-md text-sm">
                          <div className="flex items-center gap-sm min-w-0 flex-1">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${semana.atingiuMeta ? 'bg-ok' : 'bg-bad'}`} />
                            <span className="font-bold text-ink-900 truncate">{semana.titulo}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-xl gap-y-2xs text-xs text-ink-500">
                            <div>Trabalhado: <span className="font-mono font-bold text-ink-900 tabular-nums">{semana.totalHoras.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Meta: <span className="font-mono text-ink-700 tabular-nums">{semana.metaVigente.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Diferença: <span className="font-mono font-bold tabular-nums" style={{ color: isPositivoOuZero ? 'var(--ok)' : 'var(--bad)' }}>{diferencaTexto}</span></div>
                            <div>Concluído: <span className="font-mono font-bold tabular-nums" style={{ color: semana.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}>{semana.percentual}%</span></div>
                          </div>
                        </div>
                      )
                    })}
                  </Surface>
                )}

                {viewMode === 'tabela' && (
                  <Surface elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                    <div className="overflow-visible md:overflow-x-auto">
                      <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                          <tr className="border-b border-hair bg-surface-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                            <th className="py-3.5 px-6">Período</th>
                            <th className="py-3.5 px-6 text-right">Trabalhado</th>
                            <th className="py-3.5 px-6 text-right">Meta</th>
                            <th className="py-3.5 px-6 text-right">Diferença</th>
                            <th className="py-3.5 px-6 text-right">%</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-hair text-sm">
                          {resumoSemanas.map((semana) => {
                            const valorDiferenca = semana.diferenca
                            const isPositivoOuZero = valorDiferenca >= 0
                            const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                            return (
                              <tr key={semana.semana_inicio} className="block md:table-row p-4 md:p-0 hover:bg-surface-2 transition-colors duration-d1 ease-ez">
                                <td className="block md:table-cell pb-2 md:py-4 md:px-6 text-base md:text-sm font-bold md:font-semibold text-ink-900">{semana.titulo}</td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono font-semibold text-ink-900 tabular-nums">
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Trabalhado</span>
                                  <span>{semana.totalHoras.toFixed(2).replace('.', ',')}h</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono text-ink-500 tabular-nums">
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Meta</span>
                                  <span>{semana.metaVigente.toFixed(2).replace('.', ',')}h</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono font-bold tabular-nums" style={{ color: isPositivoOuZero ? 'var(--ok)' : 'var(--bad)' }}>
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Diferença</span>
                                  <span>{diferencaTexto}</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono font-bold tabular-nums" style={{ color: semana.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}>
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">%</span>
                                  <span>{semana.percentual}%</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-center">
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Status</span>
                                  <span>
                                    <Chip tom={semana.atingiuMeta ? 'ok' : 'erro'}>
                                      {semana.atingiuMeta ? 'Atingida' : 'Pendente'}
                                    </Chip>
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Surface>
                )}
              </div>
            )}

            {/* =========================================================================
                ABA: DIÁRIO
               ========================================================================= */}
            {abaAtiva === 'diario' && (
              <div>
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-xl">
                    {resumoDias.map((dia) => {
                      const valorDiferenca = dia.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`

                      return (
                        <Surface
                          key={dia.data}
                          elevacao={1}
                          comBorda
                          padding="nenhum"
                          className="p-5 space-y-4 flex flex-col justify-between hover:border-hair-strong transition-colors duration-d1 ease-ez"
                        >
                          {/* Cabeçalho */}
                          <div className="flex justify-between items-start gap-lg">
                            <div>
                              <h3 className="text-sm font-display font-bold text-ink-900 leading-snug">{dia.titulo}</h3>
                            </div>
                            <div className="shrink-0">
                              <Chip tom={dia.atingiuMeta ? 'ok' : 'erro'}>
                                {dia.atingiuMeta ? 'Atingida' : 'Pendente'}
                              </Chip>
                            </div>
                          </div>

                          {/* Dados */}
                          <div className="flex justify-between py-2 border-y border-hair">
                            <div>
                              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block mb-0.5 font-ui">Trabalhado</span>
                              <span className="text-base font-mono font-bold text-ink-900 tabular-nums">{dia.totalHoras.toFixed(2).replace('.', ',')}h</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block mb-0.5 font-ui">Diferença</span>
                              <span className="text-base font-mono font-bold tabular-nums" style={{ color: isPositivoOuZero ? 'var(--ok)' : 'var(--bad)' }}>{diferencaTexto}</span>
                            </div>
                          </div>

                          {/* Progresso */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-semibold">
                              <span className="text-ink-500">Meta: {dia.metaDiariaVigente.toFixed(2).replace('.', ',')}h</span>
                              <span style={{ color: dia.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}>{dia.percentual}%</span>
                            </div>
                            <div className="w-full bg-surface-0 h-2 rounded-full overflow-hidden border border-hair">
                              <div
                                className="h-full rounded-full transition-[width,background-color] duration-d2 ease-ez"
                                style={{ width: `${dia.percentual}%`, backgroundColor: dia.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}
                              />
                            </div>
                          </div>
                        </Surface>
                      )
                    })}
                  </div>
                )}

                {viewMode === 'lista' && (
                  <Surface elevacao={1} comBorda padding="nenhum" className="flex flex-col gap-sm p-4 divide-y divide-hair">
                    {resumoDias.map((dia) => {
                      const valorDiferenca = dia.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                      return (
                        <div key={dia.data} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 first:pt-0 last:pb-0 gap-md text-sm">
                          <div className="flex items-center gap-sm min-w-0 flex-1">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dia.atingiuMeta ? 'bg-ok' : 'bg-bad'}`} />
                            <span className="font-bold text-ink-900 truncate">{dia.titulo}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-xl gap-y-2xs text-xs text-ink-500">
                            <div>Trabalhado: <span className="font-mono font-bold text-ink-900 tabular-nums">{dia.totalHoras.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Meta: <span className="font-mono text-ink-700 tabular-nums">{dia.metaDiariaVigente.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Diferença: <span className="font-mono font-bold tabular-nums" style={{ color: isPositivoOuZero ? 'var(--ok)' : 'var(--bad)' }}>{diferencaTexto}</span></div>
                            <div>Concluído: <span className="font-mono font-bold tabular-nums" style={{ color: dia.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}>{dia.percentual}%</span></div>
                          </div>
                        </div>
                      )
                    })}
                  </Surface>
                )}

                {viewMode === 'tabela' && (
                  <Surface elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                    <div className="overflow-visible md:overflow-x-auto">
                      <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                          <tr className="border-b border-hair bg-surface-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                            <th className="py-3.5 px-6">Dia</th>
                            <th className="py-3.5 px-6 text-right">Trabalhado</th>
                            <th className="py-3.5 px-6 text-right">Meta</th>
                            <th className="py-3.5 px-6 text-right">Diferença</th>
                            <th className="py-3.5 px-6 text-right">%</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-hair text-sm">
                          {resumoDias.map((dia) => {
                            const valorDiferenca = dia.diferenca
                            const isPositivoOuZero = valorDiferenca >= 0
                            const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                            return (
                              <tr key={dia.data} className="block md:table-row p-4 md:p-0 hover:bg-surface-2 transition-colors duration-d1 ease-ez">
                                <td className="block md:table-cell pb-2 md:py-4 md:px-6 text-base md:text-sm font-bold md:font-semibold text-ink-900">{dia.titulo}</td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono font-semibold text-ink-900 tabular-nums">
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Trabalhado</span>
                                  <span>{dia.totalHoras.toFixed(2).replace('.', ',')}h</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono text-ink-500 tabular-nums">
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Meta</span>
                                  <span>{dia.metaDiariaVigente.toFixed(2).replace('.', ',')}h</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono font-bold tabular-nums" style={{ color: isPositivoOuZero ? 'var(--ok)' : 'var(--bad)' }}>
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Diferença</span>
                                  <span>{diferencaTexto}</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right font-mono font-bold tabular-nums" style={{ color: dia.atingiuMeta ? 'var(--ok)' : 'var(--bad)' }}>
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">%</span>
                                  <span>{dia.percentual}%</span>
                                </td>
                                <td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-center">
                                  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Status</span>
                                  <span>
                                    <Chip tom={dia.atingiuMeta ? 'ok' : 'erro'}>
                                      {dia.atingiuMeta ? 'Atingida' : 'Pendente'}
                                    </Chip>
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Surface>
                )}
              </div>
            )}

            {/* =========================================================================
                ABA: PROJETOS 
               ========================================================================= */}
            {abaAtiva === 'projetos' && (
              <div className="space-y-8">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setApenasBillable(v => !v)}
                    className="flex items-center gap-sm text-sm font-semibold text-ink-700 hover:text-ink-900 transition-colors duration-d1 ease-ez py-2 min-h-[44px]"
                  >
                    <span
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-d1 ease-ez ${apenasBillable ? 'bg-accent' : 'bg-surface-3'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-d1 ease-ez ${apenasBillable ? 'translate-x-4' : 'translate-x-1'
                          }`}
                      />
                    </span>
                    Apenas billable
                  </button>
                </div>
                {/* Seção Projetos */}
                <div>
                  <Secao titulo="Projetos" />
                  {projetosVisiveis.length === 0 ? (
                    <Surface elevacao={1} comBorda padding="nenhum" className="p-4 text-sm text-ink-500">Nenhum projeto registrado.</Surface>
                  ) : (
                    <div className="space-y-10">
                      {/* Ativos */}
                      {ativosOrdenados.length > 0 && (
                        <div>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={ativosOrdenados.map(p => p.id)} strategy={rectSortingStrategy}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl">
                                {ativosOrdenados.map(proj => {
                                  const temContrato = proj.horas_contratadas !== null && proj.horas_contratadas > 0;
                                  const percentual = temContrato ? Math.min(100, Math.round((proj.totalHoras / proj.horas_contratadas) * 100)) : 0;
                                  const passou = temContrato && proj.totalHoras > proj.horas_contratadas;
                                  const diff = temContrato ? Math.abs(proj.horas_contratadas - proj.totalHoras) : 0;
                                  const isExpanded = projetosExpandidos[proj.id] || false;
                                  const hasDetalhamento = proj.registros.length > 0 || proj.subcategorias.length > 0;

                                  return (
                                    <ProjetoCardSortable key={proj.id} id={proj.id}>
                                      <Surface
                                        elevacao={1}
                                        comBorda
                                        padding="nenhum"
                                        interativo
                                        onClick={() => navigate(`/projeto/${proj.id}`)}
                                        className="p-6 flex flex-col space-y-4 cursor-pointer hover:border-hair-strong transition-colors duration-d1 ease-ez"
                                      >
                                        <div className="flex items-start justify-between gap-md">
                                          <div className="flex items-center gap-md min-w-0">
                                            <span className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: proj.cor }}>
                                              <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                                            </span>
                                            <span className="font-bold text-ink-900 uppercase text-base whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis" title={proj.nome}>{proj.nome}</span>
                                          </div>
                                        </div>
                                        <hr className="border-hair" />
                                        <div className="flex-1 space-y-3">
                                          {temContrato ? (
                                            <p className="text-sm font-medium text-ink-500">
                                              <span className="text-ink-900 font-bold font-mono tabular-nums">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas de <span className="font-mono tabular-nums">{proj.horas_contratadas.toFixed(2).replace('.', ',')}h</span> contratadas
                                            </p>) : (
                                            <p className="text-sm font-medium text-ink-500">
                                              <span className="text-ink-900 font-bold font-mono tabular-nums">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas
                                            </p>
                                          )}
                                          {temContrato && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-md">
                                                <div className="flex-1 bg-surface-0 h-[6px] rounded-full overflow-hidden border border-hair">
                                                  <div className="h-full transition-[width,background-color] duration-d2 ease-ez" style={{ width: `${percentual}%`, backgroundColor: passou ? 'var(--bad)' : 'var(--ok)' }} />
                                                </div>
                                                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: passou ? 'var(--bad)' : 'var(--ok)' }}>{percentual}%</span>
                                              </div>
                                              {passou ? (
                                                <p className="text-sm font-bold text-bad font-mono tabular-nums">{diff.toFixed(2).replace('.', ',')}h acima do contrato</p>
                                              ) : (
                                                <p className="text-sm font-bold text-ok font-mono tabular-nums">{diff.toFixed(2).replace('.', ',')}h restantes</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        {hasDetalhamento && (
                                          <div className="pt-2">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); toggleProjeto(proj.id) }}
                                              className="w-full flex items-center justify-between text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez py-3.5 focus:outline-none"
                                            >
                                              <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                                              <ChevronDown className={`w-icon-sm h-icon-sm transition-transform duration-d2 ease-ez ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className={`overflow-hidden transition-[max-height,opacity,margin] duration-d2 ease-ez ${isExpanded ? 'max-h-[32rem] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                              <BreakdownSubcategorias subcategorias={proj.subcategorias} />
                                            </div>
                                          </div>
                                        )}
                                      </Surface>
                                    </ProjetoCardSortable>
                                  )
                                })}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}

                      {/* Inativos */}
                      {projetosVisiveis.filter(p => p.status !== 'ativo' && !p.arquivado).length > 0 && (
                        <div>
                          <h2 className="text-lg font-display font-bold text-ink-700 mb-4">Encerrados / Excluídos</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl">
                            {projetosVisiveis.filter(p => p.status !== 'ativo' && !p.arquivado).map(proj => {
                              const temContrato = proj.horas_contratadas !== null && proj.horas_contratadas > 0;
                              const isExpanded = projetosExpandidos[proj.id] || false;
                              const hasDetalhamento = proj.registros.length > 0 || proj.subcategorias.length > 0;

                              const isExcluido = proj.status === 'excluido';
                              const projNome = isExcluido ? (proj.nome_original || 'Sem Projeto') : (proj.nome || 'Sem Projeto');
                              const projCor = isExcluido ? '#4B5563' : '#6B7280';

                              return (
                                <Surface
                                  key={proj.id}
                                  elevacao={1}
                                  comBorda
                                  padding="nenhum"
                                  interativo
                                  onClick={() => navigate(`/projeto/${proj.id}`)}
                                  className="p-6 flex flex-col space-y-4 opacity-60 hover:opacity-80 cursor-pointer hover:border-hair-strong transition-[opacity,border-color] duration-d1 ease-ez"
                                >
                                  <div className="flex items-start justify-between gap-md">
                                    <div className="flex items-center gap-md min-w-0">
                                      <span className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: projCor }}>
                                        <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                                      </span>
                                      <span className={`font-bold text-ink-900 uppercase text-base whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis ${isExcluido ? 'italic' : ''}`} title={projNome}>{projNome}</span>
                                    </div>
                                    <Chip tom="neutro" className="shrink-0">
                                      {isExcluido ? 'Excluído' : 'Encerrado'}
                                    </Chip>
                                  </div>
                                  <hr className="border-hair" />
                                  <div className="flex-1 space-y-3">
                                    {temContrato ? (
                                      <p className="text-sm font-medium text-ink-500">
                                        <span className="text-ink-900 font-bold font-mono tabular-nums">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas de <span className="font-mono tabular-nums">{proj.horas_contratadas.toFixed(2).replace('.', ',')}h</span> contratadas
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium text-ink-500">
                                        <span className="text-ink-900 font-bold font-mono tabular-nums">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas
                                      </p>
                                    )}
                                  </div>
                                  {hasDetalhamento && (
                                    <div className="pt-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleProjeto(proj.id) }}
                                        className="w-full flex items-center justify-between text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez py-3.5 focus:outline-none"
                                      >
                                        <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                                        <ChevronDown className={`w-icon-sm h-icon-sm transition-transform duration-d2 ease-ez ${isExpanded ? 'rotate-180' : ''}`} />
                                      </button>
                                      <div className={`overflow-hidden transition-[max-height,opacity,margin] duration-d2 ease-ez ${isExpanded ? 'max-h-[32rem] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                        <BreakdownSubcategorias subcategorias={proj.subcategorias} />
                                      </div>
                                    </div>
                                  )}
                                  <div className="pt-3 border-t border-hair mt-auto">
                                    <Button
                                      variante="secundario"
                                      tamanho="sm"
                                      larguraTotal
                                      className="min-h-[44px]"
                                      onClick={(e) => { e.stopPropagation(); handleArquivar(proj.id) }}
                                    >
                                      Arquivar Projeto
                                    </Button>
                                  </div>
                                </Surface>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Arquivados */}
                      {projetosVisiveis.filter(p => p.arquivado).length > 0 && (
                        <div className="border-t border-hair pt-6">
                          <button
                            onClick={() => setMostrarArquivados(!mostrarArquivados)}
                            className="flex items-center gap-sm text-ink-500 hover:text-ink-900 transition-colors py-2 duration-d1 ease-ez mb-4 focus:outline-none"
                          >
                            <ChevronDown className={`w-icon-sm h-icon-sm shrink-0 transition-transform duration-d2 ease-ez ${mostrarArquivados ? 'rotate-180' : '-rotate-90'}`} />
                            <h2 className="text-lg font-display font-bold">Arquivados ({projetosVisiveis.filter(p => p.arquivado).length})</h2>
                          </button>

                          {mostrarArquivados && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl">
                              {projetosVisiveis.filter(p => p.arquivado).map(proj => {
                                const temContrato = proj.horas_contratadas !== null && proj.horas_contratadas > 0;
                                const isExpanded = projetosExpandidos[proj.id] || false;
                                const hasDetalhamento = proj.registros.length > 0 || proj.subcategorias.length > 0;

                                const isExcluido = proj.status === 'excluido';
                                const isEncerrado = proj.status === 'encerrado';
                                const projNome = isExcluido ? (proj.nome_original || 'Sem Projeto') : (proj.nome || 'Sem Projeto');
                                const projCor = isExcluido ? '#4B5563' : isEncerrado ? '#6B7280' : proj.cor;

                                return (
                                  <Surface
                                    key={proj.id}
                                    elevacao={1}
                                    comBorda
                                    padding="nenhum"
                                    interativo
                                    onClick={() => navigate(`/projeto/${proj.id}`)}
                                    className="p-6 flex flex-col space-y-4 opacity-40 hover:opacity-60 cursor-pointer hover:border-hair-strong transition-[opacity,border-color] duration-d1 ease-ez"
                                  >
                                    <div className="flex items-start justify-between gap-md">
                                      <div className="flex items-center gap-md min-w-0">
                                        <span className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: projCor }}>
                                          <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                                        </span>
                                        <span className={`font-bold text-ink-900 uppercase text-base whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis ${isExcluido || isEncerrado ? 'italic' : ''}`} title={projNome}>{projNome}</span>
                                      </div>
                                    </div>
                                    <hr className="border-hair" />
                                    <div className="flex-1 space-y-3">
                                      {temContrato ? (
                                        <p className="text-sm font-medium text-ink-500">
                                          <span className="text-ink-900 font-bold font-mono tabular-nums">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas de <span className="font-mono tabular-nums">{proj.horas_contratadas.toFixed(2).replace('.', ',')}h</span> contratadas
                                        </p>
                                      ) : (
                                        <p className="text-sm font-medium text-ink-500">
                                          <span className="text-ink-900 font-bold font-mono tabular-nums">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas
                                        </p>
                                      )}
                                    </div>
                                    {hasDetalhamento && (
                                      <div className="pt-2">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleProjeto(proj.id) }}
                                          className="w-full flex items-center justify-between text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez py-3.5 focus:outline-none"
                                        >
                                          <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                                          <ChevronDown className={`w-icon-sm h-icon-sm transition-transform duration-d2 ease-ez ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        <div className={`overflow-hidden transition-[max-height,opacity,margin] duration-d2 ease-ez ${isExpanded ? 'max-h-[32rem] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                          <BreakdownSubcategorias subcategorias={proj.subcategorias} />
                                        </div>
                                      </div>
                                    )}
                                    <div className="pt-3 border-t border-hair mt-auto flex flex-col gap-sm">
                                      <Button
                                        variante="secundario"
                                        tamanho="sm"
                                        larguraTotal
                                        className="min-h-[44px]"
                                        onClick={(e) => { e.stopPropagation(); handleDesarquivar(proj.id) }}
                                      >
                                        Desarquivar Projeto
                                      </Button>
                                      {isExcluido && (
                                        <Button
                                          variante="destrutivo"
                                          tamanho="sm"
                                          larguraTotal
                                          className="min-h-[44px]"
                                          onClick={(e) => { e.stopPropagation(); setProjetoParaExcluir({ id: proj.id, nome: projNome }) }}
                                        >
                                          Excluir permanentemente
                                        </Button>
                                      )}
                                    </div>
                                  </Surface>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Seção Rotina */}
                {resumoProjetos.rotinas.length > 0 && (
                  <div>
                    <Secao titulo="Rotina" />
                    <Surface elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                      <div className="divide-y divide-hair">
                        {resumoProjetos.rotinas.map((rotina) => {
                          const isExpanded = rotinasExpandidas[rotina.id] || false;
                          return (
                            <div key={rotina.id} className="flex flex-col border-b border-hair last:border-0">
                              <div
                                className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors duration-d1 ease-ez cursor-pointer"
                                onClick={() => toggleRotina(rotina.id)}
                              >
                                <div className="flex items-center gap-lg min-w-0">
                                  <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: rotina.cor }}></span>
                                  <p className="font-bold text-ink-900 text-sm uppercase tracking-wide whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis" title={rotina.nome}>{rotina.nome}</p>
                                </div>
                                <div className="flex items-center gap-lg text-right shrink-0">
                                  <span className="font-mono font-bold text-accent tabular-nums text-base">{rotina.totalHoras.toFixed(2).replace('.', ',')}h</span>
                                  <span className="text-xs font-semibold text-ink-500 w-[70px]">{rotina.qtd} {rotina.qtd === 1 ? 'registro' : 'registros'}</span>
                                  <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d2 ease-ez ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                                </div>
                              </div>

                              <div className={`overflow-hidden transition-[max-height,opacity,margin] duration-d2 ease-ez ${isExpanded ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
                                <div className="flex flex-col gap-2xs px-4 ml-[22px] border-l-2 border-hair pl-3">
                                  {rotina.registros.map((reg: any) => (
                                    <div key={reg.id} className="flex items-center gap-md py-1">
                                      <span className="text-xs text-ink-500 font-mono tabular-nums w-[50px] shrink-0">{formatarDataCurta(reg.data)}</span>
                                      <span className="text-ink-300">·</span>
                                      <span className="text-xs text-ink-500 font-mono tabular-nums w-[85px] shrink-0">{reg.hora_inicio.slice(0, 5)}-{reg.hora_fim.slice(0, 5)}</span>
                                      <span className="text-ink-300">·</span>
                                      <span className="text-xs text-ink-500 font-mono tabular-nums font-bold shrink-0">{reg.duracao.toFixed(2).replace('.', ',')}h</span>
                                      {reg.observacao && (
                                        <>
                                          <span className="text-ink-300">·</span>
                                          <span className="text-[11px] text-ink-500 italic truncate" title={reg.observacao}>{reg.observacao}</span>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Surface>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão Permanente */}
      {projetoParaExcluir && (
        <div className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Surface
            elevacao={2}
            comBorda
            comSombra={false}
            padding="nenhum"
            className="w-[95%] sm:w-full max-w-md p-6 shadow-e3 flex flex-col"
          >
            <h3 className="text-xl font-display font-bold text-ink-900 mb-2 flex items-center gap-sm">
              <AlertTriangle className="w-icon-md h-icon-md text-bad shrink-0" /> Atenção — Ação irreversível
            </h3>
            <p className="text-sm text-ink-500 mb-6 leading-relaxed">
              Todos os lançamentos vinculados a <strong className="text-ink-900">{projetoParaExcluir.nome}</strong> serão excluídos permanentemente.
              <br /><br />
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col sm:flex-row gap-md">
              <Button
                variante="secundario"
                tamanho="md"
                type="button"
                onClick={() => setProjetoParaExcluir(null)}
                className="w-full sm:flex-1 sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                variante="destrutivo"
                tamanho="md"
                type="button"
                onClick={handleConfirmarExclusaoPermanente}
                className="w-full sm:flex-1 sm:w-auto min-h-[44px]"
              >
                Excluir tudo permanentemente
              </Button>
            </div>
          </Surface>
        </div>
      )}
    </div>
  )
}
