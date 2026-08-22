import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfig } from '../contexts/ConfigContext'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  List,
  Plus,
  X
} from 'lucide-react'
import { Button, Surface, classeCampo } from '../components/ui'
import Sidebar from '../components/Sidebar'
import {
  listarRegistros,
  excluirRegistro,
  criarRegistro,
  atualizarRegistro
} from '../services/registros'
import { listarProjetos } from '../services/projetos'
import { listarHorariosDias, salvarHorarioDia } from '../services/horarios'
import { listarHorariosSemana } from '../services/horariosSemana'
import { getErrorMessage } from '../utils/errors'
import type { Registro, Projeto, HorarioDia, HorarioSemana } from '../types'
import ModalRegistro from '../components/ModalRegistro'
import ModalHorarioDia from '../components/ModalHorarioDia'
import { Skeleton } from '../components/Skeleton'
import { intervaloDaSemana, formatYYYYMMDD, type InicioSemana } from '../utils/semana'

// Helper para converter "HH:MM" em minutos para cálculo de gaps
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getWeekRange(dateStr: string, inicio: InicioSemana) {
  return intervaloDaSemana(dateStr, inicio)
}

function getWeekKey(dateStr: string, inicio: InicioSemana) {
  const { inicio: dtInicio } = getWeekRange(dateStr, inicio)
  const y = dtInicio.getFullYear()
  const m = String(dtInicio.getMonth() + 1).padStart(2, '0')
  const d = String(dtInicio.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatarIntervaloSemana(dataStr: string, inicio: InicioSemana): string {
  const { inicio: dtInicio, fim: dtFim } = intervaloDaSemana(dataStr, inicio)
  const d1 = String(dtInicio.getDate()).padStart(2, '0')
  const m1 = String(dtInicio.getMonth() + 1).padStart(2, '0')
  const d2 = String(dtFim.getDate()).padStart(2, '0')
  const m2 = String(dtFim.getMonth() + 1).padStart(2, '0')
  const y1 = dtInicio.getFullYear()
  const y2 = dtFim.getFullYear()

  if (y1 !== y2) {
    return `${d1}/${m1}/${y1} a ${d2}/${m2}/${y2}`
  }
  return `${d1}/${m1} a ${d2}/${m2}`
}

export default function Registros() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { config } = useConfig()

  // Estados dos Dados
  const [registros, setRegistros] = useState<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; status: 'ativo' | 'encerrado' | 'excluido'; nome_original: string | null } | null })[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [horariosExcecoes, setHorariosExcecoes] = useState<HorarioDia[]>([])
  const [horariosSemana, setHorariosSemana] = useState<HorarioSemana[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados dos Filtros
  const [filtroProjetoId, setFiltroProjetoId] = useState<string>('todos')
  const [filtroSemana, setFiltroSemana] = useState<string>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return getWeekKey(`${y}-${m}-${d}`, 'segunda')
  })
  const [filtroDiaEspecifico, setFiltroDiaEspecifico] = useState<string>('')

  useEffect(() => {
    if (!config?.inicio_semana) return
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    setFiltroSemana(getWeekKey(`${y}-${m}-${d}`, config.inicio_semana))
  }, [config?.inicio_semana])

  const [diasExpandidos, setDiasExpandidos] = useState<{ [key: string]: boolean }>({})
  const [viewMode, setViewMode] = useState<'lista' | 'projeto'>(() => {
    return (localStorage.getItem('horas_view_registros') as 'lista' | 'projeto') || 'lista'
  })

  const changeViewMode = (mode: 'lista' | 'projeto') => {
    setViewMode(mode)
    localStorage.setItem('horas_view_registros', mode)
  }

  // Estados do Modal de Registros
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; status: 'ativo' | 'encerrado' | 'excluido'; nome_original: string | null } | null }) | null>(null)

  // Estados do Modal de Horário do Dia
  const [isModalHorarioOpen, setIsModalHorarioOpen] = useState(false)
  const [modalHorarioData, setModalHorarioData] = useState<{
    data: string,
    inicio: string,
    fim: string
  } | null>(null)

  // Carregar dados iniciais
  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      // 2. Carregar Projetos
      const projs = await listarProjetos(user.id)
      setProjetos(projs)

      // 3. Carregar Exceções de Horários
      const excecoes = await listarHorariosDias(user.id)
      setHorariosExcecoes(excecoes)

      // 3.5. Carregar Horários da Semana
      const semHorarios = await listarHorariosSemana(user.id)
      setHorariosSemana(semHorarios)

      // 4. Carregar Registros
      const regs = await listarRegistros(user.id)
      setRegistros(regs)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user])

  useEffect(() => {
    const dataParam = searchParams.get('data')
    const projetoIdParam = searchParams.get('projeto_id')

    if (dataParam) {
      const isFormatValid = /^\d{4}-\d{2}-\d{2}$/.test(dataParam)
      if (isFormatValid) {
        const parsedDate = new Date(`${dataParam}T00:00:00`)
        if (!isNaN(parsedDate.getTime())) {
          setFiltroDiaEspecifico(dataParam)
          setDiasExpandidos(prev => ({ ...prev, [dataParam]: true }))
        }
      }
    }

    if (projetoIdParam) {
      setFiltroProjetoId(projetoIdParam)
    }

    const novoParam = searchParams.get('novo')
    if (novoParam === '1') {
      setEditingRegistro(null)
      setIsModalOpen(true)
      const proximos = new URLSearchParams(searchParams)
      proximos.delete('novo')
      setSearchParams(proximos, { replace: true })
    }
  }, [searchParams])

  // ===============================
  // LÓGICA DE REGISTROS (CRUD)
  // ===============================
  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de horas?')) return
    try {
      setError(null)
      await excluirRegistro(id)
      if (user) {
        const regs = await listarRegistros(user.id)
        setRegistros(regs)
      }
      showToast('Registro excluído!', 'success')
    } catch (err: any) {
      console.error('Erro ao excluir registro:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleSalvarRegistro = async (dados: {
    projeto_id: string | null
    subcategoria_id: string | null
    data: string
    hora_inicio: string
    hora_fim: string
    observacao: string | null
  }) => {
    if (!user) return
    try {
      if (editingRegistro) {
        await atualizarRegistro(editingRegistro.id, dados, config.inicio_semana)
      } else {
        await criarRegistro({
          usuario_id: user.id,
          projeto_id: dados.projeto_id,
          subcategoria_id: dados.subcategoria_id,
          data: dados.data,
          hora_inicio: dados.hora_inicio,
          hora_fim: dados.hora_fim,
          observacao: dados.observacao
        }, config.inicio_semana)
      }
      const regs = await listarRegistros(user.id)
      setRegistros(regs)
      fecharModal()
      showToast('Registro salvo!', 'success')
    } catch (err: any) {
      console.error('Erro ao salvar registro:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const abrirNovoRegistroModal = () => {
    setEditingRegistro(null)
    setIsModalOpen(true)
  }

  const abrirEditarRegistroModal = (reg: any) => {
    setEditingRegistro(reg)
    setIsModalOpen(true)
  }

  const fecharModal = () => {
    setIsModalOpen(false)
    setEditingRegistro(null)
  }

  // ===============================
  // LÓGICA DE HORÁRIO DIÁRIO (CRUD)
  // ===============================
  const abrirModalHorario = (dataStr: string) => {
    const limits = getLimitesDia(dataStr)
    setModalHorarioData({
      data: dataStr,
      inicio: limits.inicio,
      fim: limits.fim
    })
    setIsModalHorarioOpen(true)
  }

  const handleSalvarHorarioDia = async (inicio: string, fim: string) => {
    if (!user || !modalHorarioData) return
    try {
      await salvarHorarioDia(user.id, modalHorarioData.data, inicio, fim)
      // Recarregar horários
      const excecoes = await listarHorariosDias(user.id)
      setHorariosExcecoes(excecoes)
      setIsModalHorarioOpen(false)
      showToast('Horário do dia atualizado!', 'success')
    } catch (err: any) {
      console.error('Erro ao salvar horário do dia:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  // Pega os limites do dia (se houver exceção usa, senão usa config default)
  const getLimitesDia = (dataStr: string) => {
    // 1. Exceção por data específica
    const excecao = horariosExcecoes.find(h => h.data === dataStr)
    if (excecao) {
      return { inicio: excecao.inicio_dia, fim: excecao.fim_dia, customizado: true }
    }

    // 2. Exceção por dia da semana
    const [ano, mes, dia] = dataStr.split('-').map(Number)
    const date = new Date(ano, mes - 1, dia)
    const diaSemana = date.getDay() // 0=Dom,1=Seg,...,6=Sáb
    const horarioSemana = horariosSemana.find(h => h.dia_semana === diaSemana)
    if (horarioSemana) {
      return { inicio: horarioSemana.inicio_dia, fim: horarioSemana.fim_dia, customizado: true }
    }

    // 3. Padrão global
    return { inicio: config.inicio_dia || '08:00', fim: config.fim_dia || '18:00', customizado: false }
  }


  // ===============================
  // FILTRAGEM E AGRUPAMENTO DIÁRIO
  // ===============================

  const toggleDia = (dataStr: string) => {
    setDiasExpandidos(prev => ({ ...prev, [dataStr]: prev[dataStr] !== true }))
  }

  const handleSemanaAnterior = () => {
    const [y, m, d] = filtroSemana.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() - 7)
    setFiltroSemana(getWeekKey(formatYYYYMMDD(dt), config.inicio_semana))
    setFiltroDiaEspecifico('')
  }

  const handleSemanaProxima = () => {
    const [y, m, d] = filtroSemana.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + 7)
    setFiltroSemana(getWeekKey(formatYYYYMMDD(dt), config.inicio_semana))
    setFiltroDiaEspecifico('')
  }

  const handleSemanaHoje = () => {
    const todayStr = formatYYYYMMDD(new Date())
    setFiltroSemana(getWeekKey(todayStr, config.inicio_semana))
    setFiltroDiaEspecifico('')
  }

  const isSemanaAtual = useMemo(() => {
    const todayStr = formatYYYYMMDD(new Date())
    return filtroSemana === getWeekKey(todayStr, config.inicio_semana)
  }, [filtroSemana, config.inicio_semana])

  // Filtragem dos registros no Frontend
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      // 1. Filtrar por Projeto
      if (filtroProjetoId !== 'todos' && reg.projeto_id !== filtroProjetoId) {
        return false
      }
      // 2. Filtrar por Dia Específico ou Semana
      if (filtroDiaEspecifico) {
        if (reg.data !== filtroDiaEspecifico) {
          return false
        }
      } else {
        if (getWeekKey(reg.data, config.inicio_semana) !== filtroSemana) {
          return false
        }
      }
      return true
    })
  }, [registros, filtroProjetoId, filtroSemana, filtroDiaEspecifico, config.inicio_semana])

  // Formatar Título da Data (ex: "seg, 18 de mai")
  const formatarTituloData = (dataStr: string) => {
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    const [ry, rm, rd] = dataStr.split('-').map(Number)
    const dataDate = new Date(ry, rm - 1, rd)
    return `${diasSemana[dataDate.getDay()]}, ${String(rd).padStart(2, '0')} de ${mesesAbrev[rm - 1]} (${ry})`
  }

  // Agrupar registros filtrados por DATA e calcular Gaps
  const registrosAgrupadosPorData = useMemo(() => {
    const grupos: { [key: string]: typeof registrosFiltrados } = {}

    registrosFiltrados.forEach((reg) => {
      if (!grupos[reg.data]) grupos[reg.data] = []
      grupos[reg.data].push(reg)
    })

    // Ordenar as chaves (datas) de forma crescente
    const datasOrdenadas = Object.keys(grupos).sort((a, b) => a.localeCompare(b))

    return datasOrdenadas.map((dataStr) => {
      const records = grupos[dataStr]
      // Ordenar registros do dia por hora de inicio crescente
      records.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

      const limites = getLimitesDia(dataStr)

      // Calcular Total de Horas no Dia
      const totalHoras = records.reduce((acc, curr) => acc + curr.duracao, 0)

      // Array de itens (pode ser Registro ou Gap)
      const items: any[] = []

      if (viewMode === 'lista') {
        // Verificar gap inicial (antes do primeiro registro)
        if (records.length > 0) {
          const minInicioDia = timeToMinutes(limites.inicio)
          const minPrimeiroReg = timeToMinutes(records[0].hora_inicio)
          const diffInic = minPrimeiroReg - minInicioDia
          if (diffInic >= 5) {
            items.push({ type: 'gap', label: 'Tempo vago', minutes: diffInic, inicio: limites.inicio, fim: records[0].hora_inicio })
          }
        }

        for (let i = 0; i < records.length; i++) {
          // Inserir o registro real
          items.push({ type: 'registro', data: records[i] })

          // Verificar gap entre este registro e o próximo
          if (i < records.length - 1) {
            const minAtualFim = timeToMinutes(records[i].hora_fim)
            const minProxInicio = timeToMinutes(records[i + 1].hora_inicio)
            const diff = minProxInicio - minAtualFim
            if (diff >= 5) {
              items.push({ type: 'gap', label: 'Tempo vago', minutes: diff, inicio: records[i].hora_fim, fim: records[i + 1].hora_inicio })
            }
          }
        }

        // Verificar gap final (depois do último registro)
        if (records.length > 0) {
          const lastReg = records[records.length - 1]
          const minUltimoReg = timeToMinutes(lastReg.hora_fim)
          const minFimDia = timeToMinutes(limites.fim)
          const diffFim = minFimDia - minUltimoReg
          if (diffFim >= 5) {
            items.push({ type: 'gap', label: 'Tempo vago', minutes: diffFim, inicio: lastReg.hora_fim, fim: limites.fim })
          }
        }
      } else {
        records.forEach(r => {
          items.push({ type: 'registro', data: r })
        })
      }

      return {
        data: dataStr,
        titulo: formatarTituloData(dataStr),
        limites,
        totalHoras,
        items
      }
    })
  }, [registrosFiltrados, horariosExcecoes, horariosSemana, config, viewMode])

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">

      <Sidebar />

      {/* 2. Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl lg:ml-[240px] space-y-6 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Lançamento de Horas</h1>
            <p className="text-sm text-ink-500 font-ui">Acompanhe seu progresso e identifique horas ociosas no seu dia.</p>
          </div>
          <Button
            variante="primario"
            onClick={abrirNovoRegistroModal}
            className="min-h-[44px] px-4 shrink-0"
            iconeEsquerda={<Plus className="w-4 h-4 shrink-0" />}
          >
            Novo Registro
          </Button>
        </div>

        {/* Mensagem de erro se houver */}
        {error && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
            className="p-4 bg-bad-bg border rounded-card text-bad text-sm flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-bad" />
            <span className="font-ui">{error}</span>
          </div>
        )}

        {/* 3. Filtros */}
        <Surface elevacao={1} comBorda padding="lg" className="flex flex-col sm:flex-row gap-4">
          {/* Projeto */}
          <div className="flex-1">
            <label className="block text-[11.5px] font-bold text-ink-500 uppercase tracking-wider mb-2 font-ui">
              Projeto
            </label>
            <select
              value={filtroProjetoId}
              onChange={(e) => setFiltroProjetoId(e.target.value)}
              className={`${classeCampo()} min-h-[44px] cursor-pointer`}
            >
              <option value="todos">Todos os Projetos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Semana */}
          <div className="flex-1">
            <label className="block text-[11.5px] font-bold text-ink-500 uppercase tracking-wider mb-2 font-ui">
              Semana
            </label>
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleSemanaAnterior}
                className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 bg-surface-2 border border-hair-strong rounded-ctl h-11 flex items-center justify-center px-3 min-w-0">
                <span className="font-mono text-[13px] text-ink-900 font-semibold text-center whitespace-nowrap min-w-[130px] select-none">
                  {formatarIntervaloSemana(filtroSemana, config.inicio_semana)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSemanaProxima}
                className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
                title="Próxima semana"
                aria-label="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSemanaHoje}
                disabled={isSemanaAtual}
                className="h-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 text-xs font-semibold px-3 rounded-ctl transition-colors duration-d1 ease-ez shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-hair-strong disabled:hover:text-ink-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Dia Específico */}
          <div className="flex-1">
            <label className="block text-[11.5px] font-bold text-ink-500 uppercase tracking-wider mb-2 font-ui">
              Dia Específico
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filtroDiaEspecifico}
                onChange={(e) => setFiltroDiaEspecifico(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className={`${classeCampo()} min-h-[44px] cursor-pointer`}
              />
              {filtroDiaEspecifico && (
                <button
                  type="button"
                  onClick={() => setFiltroDiaEspecifico('')}
                  className="text-xs text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez cursor-pointer whitespace-nowrap px-2 min-h-[44px] inline-flex items-center gap-1 shrink-0 font-medium"
                  title="Limpar data"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>
        </Surface>

        {/* Toggle de Visualização */}
        <div className="flex justify-end items-center gap-2">
          <span className="text-xs font-semibold text-ink-500 px-2.5 hidden sm:inline font-ui">Visualização:</span>
          <div className="flex bg-surface-1 p-1 rounded-ctl border border-hair">
            <button
              onClick={() => changeViewMode('lista')}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-ctl text-xs font-semibold transition-colors duration-d1 ease-ez ${
                viewMode === 'lista'
                  ? 'bg-accent-bg text-accent-fg'
                  : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
              }`}
              title="Lista detalhada com gaps"
            >
              <List className="w-4 h-4 shrink-0" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => changeViewMode('projeto')}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-ctl text-xs font-semibold transition-colors duration-d1 ease-ez ${
                viewMode === 'projeto'
                  ? 'bg-accent-bg text-accent-fg'
                  : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
              }`}
              title="Agrupado por projeto"
            >
              <FolderKanban className="w-4 h-4 shrink-0" />
              <span>Por Projeto</span>
            </button>
          </div>
        </div>

        {/* 4. Lista de Registros Agrupados por Dia */}
        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="h-[68px] w-full rounded-lg" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-[52px] w-full rounded-lg" />
                  <Skeleton className="h-[52px] w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : registrosAgrupadosPorData.length === 0 ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum lançamento encontrado</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Não encontramos nenhum registro de horas para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {registrosAgrupadosPorData.map((grupo) => {
              const isExpanded = diasExpandidos[grupo.data] === true

              return (
                <div key={grupo.data} className="relative">
                  {/* Cabeçalho do Grupo de Dia */}
                  <div
                    className="bg-[#1E2530] border-l-[3px] border-l-[#03A9F4] rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 cursor-pointer hover:bg-[#252d3a] transition-colors relative z-10"
                    onClick={() => toggleDia(grupo.data)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <svg className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                          <span className="capitalize normal-case">{grupo.titulo}</span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                          Jornada: <span className="font-mono text-gray-300">{grupo.limites.inicio.slice(0, 5)} às {grupo.limites.fim.slice(0, 5)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Lançado</span>
                        <span className="text-sm sm:text-lg font-mono font-bold text-emerald-400">
                          {grupo.totalHoras.toFixed(2).replace('.', ',')}h
                        </span>
                      </div>
                      <span className="h-8 w-px bg-gray-800 hidden sm:inline" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          abrirModalHorario(grupo.data)
                        }}
                        className="p-2 text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 rounded-xl transition-all focus:outline-none"
                        title="Editar Horário do Dia"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="sr-only">Editar Horário do Dia</span>
                      </button>
                    </div>
                  </div>

                  {/* Lançamentos e Gaps */}
                  <div className={`flex flex-col gap-1.5 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                    {viewMode === 'projeto' ? (
                      // Agrupar registros do dia por projeto
                      (() => {
                        const registrosPorProjeto: {
                          [projId: string]: {
                            projeto: typeof registrosFiltrados[0]['projeto'] | null,
                            records: typeof registrosFiltrados,
                            subtotal: number
                          }
                        } = {}

                        // Filtrar apenas registros (não deve ter gaps aqui, mas por segurança filtramos)
                        const recordsOnly = grupo.items
                          .filter((item: any) => item.type === 'registro')
                          .map((item: any) => item.data)

                        recordsOnly.forEach((reg) => {
                          const projId = reg.projeto_id || 'sem-projeto'
                          if (!registrosPorProjeto[projId]) {
                            registrosPorProjeto[projId] = {
                              projeto: reg.projeto,
                              records: [],
                              subtotal: 0
                            }
                          }
                          registrosPorProjeto[projId].records.push(reg)
                          registrosPorProjeto[projId].subtotal += reg.duracao
                        })

                        return Object.entries(registrosPorProjeto).map(([projId, itemProj]) => {
                          const status = itemProj.projeto?.status
                          const isEncerrado = status === 'encerrado'
                          const isExcluido = status === 'excluido'
                          const projCor = isExcluido ? '#6B7280' : isEncerrado ? '#9CA3AF' : (itemProj.projeto?.cor || '#6B7280')
                          const projNome = isExcluido ? (itemProj.projeto?.nome_original || 'Sem Projeto') : (itemProj.projeto?.nome || 'Sem Projeto')

                          return (
                            <div key={projId} className="bg-[#161B22]/30 border border-gray-800/60 rounded-xl p-3 mb-2 flex flex-col gap-2">
                              {/* Header do Projeto */}
                              <div className="flex justify-between items-center border-b border-gray-800/40 pb-2">
                                <div className="flex items-center gap-2">
                                  {itemProj.projeto?.tipo === 'rotina' ? (
                                    <span
                                      title={projNome}
                                      className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-[4px] text-[11px] font-semibold border max-w-[160px] bg-transparent ${isEncerrado || isExcluido ? 'italic' : ''}`}
                                      style={{
                                        borderColor: projCor,
                                        color: projCor
                                      }}
                                    >
                                      <span className={`truncate ${isExcluido ? 'line-through' : ''}`}>· {projNome}</span>
                                      {isEncerrado && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Encerrado</span>}
                                      {isExcluido && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Excluído</span>}
                                    </span>
                                  ) : (
                                    <span
                                      title={projNome}
                                      className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[11px] font-semibold border max-w-[160px] ${isEncerrado || isExcluido ? 'italic' : ''}`}
                                      style={{
                                        backgroundColor: `${projCor}12`,
                                        borderColor: `${projCor}44`,
                                        color: projCor
                                      }}
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: projCor }} />
                                      <span className={`truncate ${isExcluido ? 'line-through' : ''}`}>{projNome}</span>
                                      {isEncerrado && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Encerrado</span>}
                                      {isExcluido && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Excluído</span>}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Subtotal: <span className="font-mono font-bold text-[#03A9F4]">{itemProj.subtotal.toFixed(2).replace('.', ',')}h</span>
                                </div>
                              </div>

                              {/* Registros deste projeto */}
                              <div className="flex flex-col gap-1">
                                {itemProj.records.map((reg) => (
                                  <div key={reg.id} className="bg-[#161B22]/50 p-3 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-[#1a212a] transition-colors group text-sm">
                                    {/* Linha 1 no Mobile: [horário] */}
                                    <div className="flex items-center justify-between md:contents w-full">
                                      {/* Horários */}
                                      <div className="shrink-0 text-left md:w-[130px]">
                                        <span className="text-sm font-mono font-semibold text-gray-300">
                                          {reg.hora_inicio.slice(0, 5)} <span className="text-gray-500">→</span> {reg.hora_fim.slice(0, 5)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Linha 2 no Mobile: [observação] [duração] [botões] */}
                                    <div className="flex items-center justify-between md:contents w-full gap-4 mt-1.5 md:mt-0">
                                      {/* Observação e Subcategoria / Fase */}
                                      <div className="flex-grow min-w-0 text-left flex items-center gap-2">
                                        {reg.subcategoria?.nome && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0E14] border border-gray-700 font-medium shrink-0 inline-flex items-center gap-1 max-w-full">
                                            {reg.subcategoria.fase?.nome && (
                                              <>
                                                <span className="text-gray-500 truncate">{reg.subcategoria.fase.nome}</span>
                                                <span className="text-gray-600">/</span>
                                              </>
                                            )}
                                            <span className="text-gray-300 truncate">{reg.subcategoria.nome}</span>
                                          </span>
                                        )}
                                        {reg.observacao && (
                                          <span
                                            className="text-sm text-gray-400 truncate min-w-0"
                                            title={reg.observacao}
                                          >
                                            {reg.observacao}
                                          </span>
                                        )}
                                      </div>

                                      {/* Duração + Botões */}
                                      <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0 md:contents">
                                        {/* Duração */}
                                        <div className="shrink-0 md:w-[80px] md:text-right">
                                          <span className="text-sm font-mono font-bold text-[#03A9F4]">
                                            {reg.duracao.toFixed(2).replace('.', ',')}h
                                          </span>
                                        </div>

                                        {/* Ações */}
                                        <div className="shrink-0 md:w-[60px] flex gap-1 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => abrirEditarRegistroModal(reg)}
                                            className="p-1.5 text-gray-500 hover:text-white transition-colors focus:outline-none"
                                            title="Editar Lançamento"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleExcluir(reg.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors focus:outline-none"
                                            title="Excluir Lançamento"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })
                      })()
                    ) : (
                      // Renderização Normal (Lista e Compacta)
                      grupo.items.map((item, index) => {
                        // ==== RENDERIZAÇÃO DO GAP ====
                        if (item.type === 'gap') {
                          const h = Math.floor(item.minutes / 60)
                          const m = item.minutes % 60
                          let descStr = ''
                          if (h === 0) descStr = `${m}min disponíveis`
                          else if (m === 0) descStr = `${h}h disponíveis`
                          else descStr = `${h}h ${m}min disponíveis`

                          return (
                            <div key={`gap-${index}`} className="flex items-center gap-3 px-4 py-1.5 text-[10px] sm:text-xs bg-red-500/10 border-l-2 border-red-500/30 text-red-400">
                              <span className="text-[10px]">○</span>
                              <span className="font-mono text-[10px] sm:text-xs">{item.inicio.slice(0, 5)} → {item.fim.slice(0, 5)}</span>
                              <span className="mx-1">·</span>
                              <span>{descStr}</span>
                            </div>
                          )
                        }

                        // ==== RENDERIZAÇÃO DO REGISTRO (LISTA) ====
                        const reg = item.data as (Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; status: 'ativo' | 'encerrado' | 'excluido'; nome_original: string | null } | null })
                        const status = reg.projeto?.status
                        const isEncerrado = status === 'encerrado'
                        const isExcluido = status === 'excluido'
                        const projCor = isExcluido ? '#6B7280' : isEncerrado ? '#9CA3AF' : (reg.projeto?.cor || '#6B7280')
                        const projNome = isExcluido ? (reg.projeto?.nome_original || 'Sem Projeto') : (reg.projeto?.nome || 'Sem Projeto')

                        return (
                          <div
                            key={reg.id}
                            className="bg-[#161B22] p-3 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-[#1a212a] transition-colors group text-sm"
                          >
                            {/* Linha 1 no Mobile: [TAG] [horário] */}
                            <div className="flex items-center justify-between md:contents w-full">
                              {/* Tag do Projeto */}
                              <div className="min-w-0 md:w-[120px] md:shrink-0">
                                {reg.projeto?.tipo === 'rotina' ? (
                                  <span
                                    title={projNome}
                                    className={`inline-flex items-center gap-1 py-1 px-2 rounded-[4px] text-[11px] font-semibold border max-w-full bg-transparent ${isEncerrado || isExcluido ? 'italic' : ''}`}
                                    style={{
                                      borderColor: projCor,
                                      color: projCor
                                    }}
                                  >
                                    <span className={`line-clamp-2 break-words ${isExcluido ? 'line-through' : ''}`}>· {projNome}</span>
                                    {isEncerrado && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Encerrado</span>}
                                    {isExcluido && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Excluído</span>}
                                  </span>
                                ) : (
                                  <span
                                    title={projNome}
                                    className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold border max-w-full ${isEncerrado || isExcluido ? 'italic' : ''}`}
                                    style={{
                                      backgroundColor: `${projCor}12`,
                                      borderColor: `${projCor}44`,
                                      color: projCor
                                    }}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: projCor }} />
                                    <span className={`line-clamp-2 break-words ${isExcluido ? 'line-through' : ''}`}>{projNome}</span>
                                    {isEncerrado && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Encerrado</span>}
                                    {isExcluido && <span className="ml-1 px-1 bg-gray-500/20 rounded text-[9px] not-italic shrink-0">Excluído</span>}
                                  </span>
                                )}
                              </div>

                              {/* Horários */}
                              <div className="shrink-0 text-right md:text-center md:w-[130px]">
                                <span className="text-sm font-mono font-semibold text-gray-300">
                                  {reg.hora_inicio.slice(0, 5)} <span className="text-gray-500">→</span> {reg.hora_fim.slice(0, 5)}
                                </span>
                              </div>
                            </div>

                            {/* Linha 2 no Mobile: [observação] [duração] [botões] */}
                            <div className="flex items-center justify-between md:contents w-full gap-4 mt-1.5 md:mt-0">
                              {/* Observação e Subcategoria / Fase */}
                              <div className="flex-grow min-w-0 text-left flex items-center gap-2">
                                {reg.subcategoria?.nome && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0E14] border border-gray-700 font-medium shrink-0 inline-flex items-center gap-1 max-w-full">
                                    {reg.subcategoria.fase?.nome && (
                                      <>
                                        <span className="text-gray-500 truncate">{reg.subcategoria.fase.nome}</span>
                                        <span className="text-gray-600">/</span>
                                      </>
                                    )}
                                    <span className="text-gray-300 truncate">{reg.subcategoria.nome}</span>
                                  </span>
                                )}
                                {reg.observacao && (
                                  <span
                                    className="text-sm text-gray-400 truncate min-w-0"
                                    title={reg.observacao}
                                  >
                                    {reg.observacao}
                                  </span>
                                )}
                              </div>

                              {/* Duração + Botões */}
                              <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0 md:contents">
                                {/* Duração */}
                                <div className="shrink-0 md:w-[80px] md:text-right">
                                  <span className="text-sm font-mono font-bold text-[#03A9F4]">
                                    {reg.duracao.toFixed(2).replace('.', ',')}h
                                  </span>
                                </div>

                                {/* Ações */}
                                <div className="shrink-0 md:w-[60px] flex gap-1 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => abrirEditarRegistroModal(reg)}
                                    className="p-1.5 text-gray-500 hover:text-white transition-colors focus:outline-none"
                                    title="Editar Lançamento"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleExcluir(reg.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors focus:outline-none"
                                    title="Excluir Lançamento"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>

      {/* Modal Registro */}
      <ModalRegistro
        isOpen={isModalOpen}
        onClose={fecharModal}
        onSave={handleSalvarRegistro}
        registro={editingRegistro}
        registrosExistentes={registros}
      />

      {/* Modal Horário Dia */}
      {modalHorarioData && (
        <ModalHorarioDia
          isOpen={isModalHorarioOpen}
          onClose={() => setIsModalHorarioOpen(false)}
          onSave={handleSalvarHorarioDia}
          dataSelecionada={modalHorarioData.data}
          inicioAtual={modalHorarioData.inicio}
          fimAtual={modalHorarioData.fim}
        />
      )}
    </div>
  )
}
