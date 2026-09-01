import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfig } from '../contexts/ConfigContext'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { getErrorMessage } from '../utils/errors'
import { 
  buscarHorasBillableSemanal, 
  buscarTotalBillableSemanal, 
  buscarHorasBillableMensal, 
  buscarTotalBillableMensal, 
  type BillablePorProjeto, 
  type BillablePorProjetoMensal 
} from '../services/billable'
import { 
  buscarMetaBillableMensal, 
  buscarMargemMinimaVigente,
  buscarMargemMinimaVigenteMensal
} from '../services/metas_billable'
import { buscarHorasBaseSemanal, buscarHorasBaseMensal } from '../services/horas_base'
import { SkeletonRow } from '../components/Skeleton'
import { inicioDaSemanaDate, diasDaSemana, formatYYYYMMDD, type InicioSemana } from '../utils/semana'
import { AlertTriangle, ChevronLeft, ChevronRight, FileChartColumn } from 'lucide-react'
import { Surface, Chip } from '../components/ui'

const LABELS_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Helper functions for week/month start date and formatting
function getInicioSemana(d: Date, inicio: InicioSemana) {
  return inicioDaSemanaDate(d, inicio)
}

function formatWeekInterval(inicioDaSemana: Date) {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const fimDaSemana = new Date(inicioDaSemana);
  fimDaSemana.setDate(inicioDaSemana.getDate() + 6);

  const m1 = String(inicioDaSemana.getDate()).padStart(2, '0');
  const m2 = String(inicioDaSemana.getMonth() + 1).padStart(2, '0');
  const ds1 = dias[inicioDaSemana.getDay()]
  
  const s1 = String(fimDaSemana.getDate()).padStart(2, '0');
  const s2 = String(fimDaSemana.getMonth() + 1).padStart(2, '0');
  const ds2 = dias[fimDaSemana.getDay()]
  const sYear = fimDaSemana.getFullYear();

  return `${ds1} ${m1}/${m2} – ${ds2} ${s1}/${s2}/${sYear}`;
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function formatMonthYear(d: Date) {
  const monthName = MESES_PT[d.getMonth()]
  const year = d.getFullYear()
  return `${monthName} ${year}`
}

function getMonthRange(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const mesInicio = formatYYYYMMDD(new Date(year, month, 1))
  const mesFim = formatYYYYMMDD(new Date(year, month + 1, 0))
  return { mesInicio, mesFim }
}

interface AnimatedNumberProps {
  value: number
  formatter: (val: number) => string
  duration?: number
}

function AnimatedNumber({ value, formatter, duration = 800 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) {
      setDisplayValue(end)
      return
    }

    const startTime = performance.now()
    let animationFrameId: number

    const updateNumber = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress) // easeOutQuad
      
      const current = start + (end - start) * easeProgress
      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber)
      } else {
        setDisplayValue(end)
      }
    }

    animationFrameId = requestAnimationFrame(updateNumber)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [value, duration])

  return <>{formatter(displayValue)}</>
}

async function calcularSaldoAcumulado(
  userId: string,
  saldoInicio: string,
  semanaAtual: string
): Promise<number> {
  const [y, m, d] = saldoInicio.split('-').map(Number)
  let current = new Date(y, m - 1, d)
  
  const [cy, cm, cd] = semanaAtual.split('-').map(Number)
  const target = new Date(cy, cm - 1, cd)
  
  let weeksCount = 0
  const promises = []
  
  while (current <= target && weeksCount < 52) {
    const startStr = formatYYYYMMDD(current)
    const end = new Date(current)
    end.setDate(end.getDate() + 6)
    const endStr = formatYYYYMMDD(end)
    
    promises.push(
      Promise.all([
        buscarTotalBillableSemanal(startStr, endStr),
        buscarHorasBaseSemanal(userId, startStr),
        buscarMargemMinimaVigente(startStr)
      ]).then(([total, horasBaseSemana, margemSemana]) => {
        const metaRealSemana = Math.round(horasBaseSemana * (margemSemana / 100) * 100) / 100
        return total - metaRealSemana
      })
    )
    
    current.setDate(current.getDate() + 7)
    weeksCount++
  }
  
  const saldos = await Promise.all(promises)
  const soma = saldos.reduce((acc, curr) => acc + curr, 0)
  return Math.round(soma * 100) / 100
}

async function calcularSaldoAcumuladoMensal(
  userId: string,
  saldoInicio: string,
  mesAtual: string
): Promise<number> {
  const [y, m] = saldoInicio.split('-').map(Number)
  let current = new Date(y, m - 1, 1) // do mês do início para frente
  
  const [cy, cm] = mesAtual.split('-').map(Number)
  const target = new Date(cy, cm - 1, 1)
  
  let monthsCount = 0
  const promises = []
  
  while (current <= target && monthsCount < 60) { // Até 5 anos
    const { mesInicio: startStr, mesFim: endStr } = getMonthRange(current)
    
    promises.push(
      Promise.all([
        buscarTotalBillableMensal(startStr, endStr),
        buscarHorasBaseMensal(userId, startStr),
        buscarMargemMinimaVigenteMensal(startStr)
      ]).then(([total, horasBaseMensal, margemMensal]) => {
        const metaReal = Math.round(horasBaseMensal * (margemMensal / 100) * 100) / 100
        return total - metaReal
      })
    )
    
    current.setMonth(current.getMonth() + 1)
    monthsCount++
  }
  
  const saldos = await Promise.all(promises)
  const soma = saldos.reduce((acc, curr) => acc + curr, 0)
  return Math.round(soma * 100) / 100
}

export default function Billable() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { config } = useConfig()
  const [activeTab, setActiveTab] = useState<'semanal' | 'mensal'>('semanal')
  const [currentDate, setCurrentDate] = useState<Date>(() => getInicioSemana(new Date(), 'segunda'))

  useEffect(() => {
    if (!config?.inicio_semana) return
    setCurrentDate(getInicioSemana(new Date(), config.inicio_semana))
  }, [config?.inicio_semana])
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const toggleRow = (id: string) =>
    setSelectedRow(prev => (prev === id ? null : id))

  // Slide state for week selector
  const [animationClass, setAnimationClass] = useState('')
  const [animKey, setAnimKey] = useState(0)

  // Slide state for month selector
  const [animationClassMonth, setAnimationClassMonth] = useState('')
  const [animKeyMonth, setAnimKeyMonth] = useState(0)

  // Data fetching states
  const [loading, setLoading] = useState(true)
  const [loadingMensal, setLoadingMensal] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billableProjetos, setBillableProjetos] = useState<BillablePorProjeto[]>([])
  const [billableProjetosMensal, setBillableProjetosMensal] = useState<BillablePorProjetoMensal[]>([])
  const [totalBillable, setTotalBillable] = useState(0)
  const [totalBillableMensal, setTotalBillableMensal] = useState(0)
  const [metaMensal, setMetaMensal] = useState(160)
  const [margemMinima, setMargemMinima] = useState(92)
  const [horasBase, setHorasBase] = useState(42.5)
  const [metaReal, setMetaReal] = useState(0)
  const [saldoSemana, setSaldoSemana] = useState(0)
  const [saldoAcumulado, setSaldoAcumulado] = useState(0)
  const [saldoInicioSemana, setSaldoInicioSemana] = useState<string | null>(null)

  const [horasBaseMensalVal, setHorasBaseMensalVal] = useState(170)
  const [margemMinimaMensalVal, setMargemMinimaMensalVal] = useState(92)
  const [metaRealMensal, setMetaRealMensal] = useState(0)
  const [saldoMensal, setSaldoMensal] = useState(0)
  const [saldoAcumuladoMensal, setSaldoAcumuladoMensal] = useState(0)

  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const startStr = formatYYYYMMDD(currentDate)
      const sunday = new Date(currentDate)
      sunday.setDate(currentDate.getDate() + 6)
      const endStr = formatYYYYMMDD(sunday)

      const [projetosData, totalBillableData, margemData, horasBaseData] = await Promise.all([
        buscarHorasBillableSemanal(startStr, endStr),
        buscarTotalBillableSemanal(startStr, endStr),
        buscarMargemMinimaVigente(startStr),
        buscarHorasBaseSemanal(user.id, startStr)
      ])

      const horasBaseVal = horasBaseData
      const metaRealVal = Math.round(horasBaseVal * (margemData / 100) * 100) / 100

      setBillableProjetos(projetosData)
      setTotalBillable(totalBillableData)
      setMargemMinima(margemData)
      
      setHorasBase(horasBaseVal)
      setMetaReal(metaRealVal)
      setSaldoSemana(Math.round((totalBillableData - metaRealVal) * 100) / 100)
      
      const saldoInicio = config.saldo_inicio_semana ?? null
      setSaldoInicioSemana(saldoInicio)

      if (saldoInicio) {
        const acumulado = await calcularSaldoAcumulado(user.id, saldoInicio, startStr)
        setSaldoAcumulado(acumulado)
      } else {
        setSaldoAcumulado(0)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do billable:', err)
      const msg = getErrorMessage(err)
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const carregarDadosMensal = async () => {
    if (!user) return
    try {
      setLoadingMensal(true)
      setError(null)

      const { mesInicio, mesFim } = getMonthRange(currentMonth)

      const [projetosData, totalBillableData, metaData, horasBaseMensalData, margemMensalData] = await Promise.all([
        buscarHorasBillableMensal(mesInicio, mesFim),
        buscarTotalBillableMensal(mesInicio, mesFim),
        buscarMetaBillableMensal(mesInicio),
        buscarHorasBaseMensal(user.id, mesInicio),
        buscarMargemMinimaVigenteMensal(mesInicio)
      ])

      setBillableProjetosMensal(projetosData)
      setTotalBillableMensal(totalBillableData)
      setMetaMensal(metaData)
      
      const metaRealMensalVal = Math.round(horasBaseMensalData * (margemMensalData / 100) * 100) / 100

      setHorasBaseMensalVal(horasBaseMensalData)
      setMargemMinimaMensalVal(margemMensalData)
      setMetaRealMensal(metaRealMensalVal)
      setSaldoMensal(Math.round((totalBillableData - metaRealMensalVal) * 100) / 100)
      
      const saldoInicio = config.saldo_inicio_semana ?? null
      
      if (saldoInicio) {
        const acumuladoMensal = await calcularSaldoAcumuladoMensal(user.id, saldoInicio, mesInicio)
        setSaldoAcumuladoMensal(acumuladoMensal)
      } else {
        setSaldoAcumuladoMensal(0)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados mensais do billable:', err)
      const msg = getErrorMessage(err)
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoadingMensal(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user, currentDate, config.inicio_semana])

  useEffect(() => {
    if (activeTab === 'mensal') {
      carregarDadosMensal()
    }
  }, [user, currentMonth, activeTab, config.inicio_semana])

  const prevWeek = () => {
    setAnimationClass('animate-slide-left')
    setAnimKey(prev => prev + 1)
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  const nextWeek = () => {
    setAnimationClass('animate-slide-right')
    setAnimKey(prev => prev + 1)
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  const prevMonth = () => {
    setAnimationClassMonth('animate-slide-left')
    setAnimKeyMonth(prev => prev + 1)
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  const nextMonth = () => {
    setAnimationClassMonth('animate-slide-right')
    setAnimKeyMonth(prev => prev + 1)
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  const days = useMemo(() => {
    return diasDaSemana(currentDate, config.inicio_semana)
  }, [currentDate, config.inicio_semana])

  const tableData = useMemo(() => {
    const rows = billableProjetos.map(p => {
      const diasValores = days.map(d => {
        const dStr = formatYYYYMMDD(d)
        return {
          dataStr: dStr,
          duracao: p.horas_por_dia[dStr] || 0
        }
      })

      const total = diasValores.reduce((acc, item) => acc + item.duracao, 0)

      return {
        projetoId: p.projeto_id,
        codigo: p.codigo_externo,
        nome: p.nome,
        diasValores,
        total
      }
    })

    // Sort by code (codigo_externo) ascending
    return rows
      .filter(r => r.total > 0)
      .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
  }, [billableProjetos, days])

  const totals = useMemo(() => {
    const totDias = Array(days.length).fill(0)
    let totalGeral = 0
    tableData.forEach(row => {
      row.diasValores.forEach((dv, idx) => {
        totDias[idx] += dv.duracao
      })
      totalGeral += row.total
    })
    return { dias: totDias, total: totalGeral }
  }, [tableData, days])

  const weeksSorted = useMemo(() => {
    const setSemanas = new Set<string>()
    billableProjetosMensal.forEach(p => {
      Object.keys(p.horas_por_semana).forEach(sem => {
        setSemanas.add(sem)
      })
    })
    return Array.from(setSemanas).sort()
  }, [billableProjetosMensal])

  const tableDataMensal = useMemo(() => {
    const rows = billableProjetosMensal.map(p => {
      const getDuracaoSemana = (sem: string) => {
        return p.horas_por_semana[sem] || 0
      }

      const semanasValores = weeksSorted.map(sem => getDuracaoSemana(sem))
      const total = semanasValores.reduce((acc, val) => acc + val, 0)

      return {
        projetoId: p.projeto_id,
        codigo: p.codigo_externo,
        nome: p.nome,
        semanasValores,
        total
      }
    })
    return rows
      .filter(r => r.total > 0)
      .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
  }, [billableProjetosMensal, weeksSorted])

  const totalsMensal = useMemo(() => {
    const totalSemanas = Array(weeksSorted.length).fill(0)
    let totalGeral = 0
    tableDataMensal.forEach(row => {
      row.semanasValores.forEach((val, idx) => {
        totalSemanas[idx] += val
      })
      totalGeral += row.total
    })
    return { semanas: totalSemanas, total: totalGeral }
  }, [tableDataMensal, weeksSorted])

  const pctMeta = metaReal > 0 ? Math.round((totalBillable / metaReal) * 100) : 0

  const pctMetaMensal = metaRealMensal > 0 ? Math.round((totalBillableMensal / metaRealMensal) * 100) : 0

  const renderCell = (duracao: number, dateStr: string, projetoId: string) => {
    if (duracao === 0) {
      return (
        <td key={dateStr} className="py-3 px-4 text-sm text-right text-ink-500 font-mono tabular-nums border-x border-hair transition-colors duration-d1 ease-ez">
          —
        </td>
      )
    }
    return (
      <td key={dateStr} className="py-3 px-4 text-sm text-right text-ink-900 font-mono tabular-nums border-x border-hair font-semibold transition-colors duration-d1 ease-ez">
        <Link
          to={`/registros?data=${dateStr}&projeto_id=${projetoId}`}
          className="hover:text-accent transition-colors duration-d1 ease-ez"
        >
          {duracao.toFixed(2).replace('.', ',')}
        </Link>
      </td>
    )
  }

  const renderCellMensal = (duracao: number, semanaStr: string, projetoId: string) => {
    if (duracao === 0) {
      return (
        <td key={semanaStr} className="py-3 px-4 text-sm text-right text-ink-500 font-mono tabular-nums border-x border-hair transition-colors duration-d1 ease-ez">
          —
        </td>
      )
    }
    return (
      <td key={semanaStr} className="py-3 px-4 text-sm text-right text-ink-900 font-mono tabular-nums border-x border-hair font-semibold transition-colors duration-d1 ease-ez">
        <Link
          to={`/registros?semana_inicio=${semanaStr}&projeto_id=${projetoId}`}
          className="hover:text-accent transition-colors duration-d1 ease-ez"
        >
          {duracao.toFixed(2).replace('.', ',')}
        </Link>
      </td>
    )
  }

  const getFooterClass = (duracao: number) => {
    let className = "py-4 px-4 text-right font-mono text-sm font-bold border-x border-hair tabular-nums "
    className += duracao === 0 ? "text-ink-500" : "text-ink-900"
    return className
  }

  const getFooterClassMensal = (duracao: number) => {
    let className = "py-4 px-4 text-right font-mono text-sm font-bold border-x border-hair tabular-nums "
    className += duracao === 0 ? "text-ink-500" : "text-ink-900"
    return className
  }

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes cardEntry {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-card-entry {
          animation: cardEntry 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideRight {
          0% { transform: translateX(-12px); opacity: 0.6; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideLeft {
          0% { transform: translateX(12px); opacity: 0.6; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-right {
          animation: slideRight 200ms ease-out forwards;
        }
        .animate-slide-left {
          animation: slideLeft 200ms ease-out forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 150ms ease-in-out forwards;
        }
      `}} />

      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        {/* Header da Seção */}
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Billable</h1>
          <p className="text-sm text-ink-500">Visão geral e metas de horas faturáveis da semana.</p>
        </div>

        {/* Abas no topo */}
        <div className="flex border-b border-hair gap-xl mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('semanal')}
            className={`pb-3 text-sm font-semibold relative transition-colors duration-d1 ease-ez min-h-[44px] ${
              activeTab === 'semanal' ? 'text-ink-900 font-bold' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Semanal
            {activeTab === 'semanal' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent transition-opacity duration-d1" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mensal')}
            className={`pb-3 text-sm font-semibold relative transition-colors duration-d1 ease-ez min-h-[44px] ${
              activeTab === 'mensal' ? 'text-ink-900 font-bold' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Mensal
            {activeTab === 'mensal' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent transition-opacity duration-d1" />
            )}
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
            className="p-4 bg-bad-bg border rounded-card text-bad text-sm flex items-center gap-md"
          >
            <AlertTriangle className="w-icon-md h-icon-md shrink-0 text-bad" />
            <span className="font-ui">{error}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="mt-6">
          {activeTab === 'semanal' ? (
            <div className="space-y-6 animate-fade-in">
              {/* Seção A: Cards de resumo */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
                  {[1, 2, 3, 4].map((i) => (
                    <Surface key={i} elevacao={1} comBorda padding="nenhum" className="animate-pulse p-6 h-32 flex flex-col justify-between">
                      <div className="h-3 bg-surface-3 rounded w-2/3" />
                      <div className="h-8 bg-surface-3 rounded w-1/2 mt-4" />
                      <div className="h-3 bg-surface-3 rounded w-1/3 mt-2" />
                    </Surface>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg" key={currentDate.getTime()}>
                  {/* Card 1 — META DA SEMANA */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      META DA SEMANA
                    </span>
                    <span className="text-3xl font-bold text-ink-900 tabular-nums mt-2 flex items-baseline gap-sm">
                      <AnimatedNumber
                        value={metaReal}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                      <span className="text-xs text-ink-500 font-normal">
                        ({margemMinima}%)
                      </span>
                    </span>
                    <span className="text-xs text-ink-500">
                      {horasBase.toFixed(2).replace('.', ',')}h base
                    </span>
                  </Surface>

                  {/* Card 2 — HORAS FEITAS */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '60ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      HORAS FEITAS
                    </span>
                    <span className="text-3xl font-bold text-ink-900 tabular-nums mt-2">
                      <AnimatedNumber
                        value={totalBillable}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="h-5" />
                  </Surface>

                  {/* Card 3 — % DA META */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '120ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      % DA META
                    </span>
                    <span className="text-3xl font-bold text-accent tabular-nums mt-2">
                      {metaReal > 0 ? (
                        <AnimatedNumber
                          value={pctMeta}
                          formatter={(v) => `${Math.round(v)}%`}
                        />
                      ) : (
                        "—"
                      )}
                    </span>
                    <div className="h-5" />
                  </Surface>

                  {/* Card 4 — SALDO DA SEMANA */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '180ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      SALDO DA SEMANA
                    </span>
                    <span className={`text-3xl font-bold tabular-nums mt-2 ${saldoSemana >= 0 ? 'text-ok' : 'text-bad'}`}>
                      <AnimatedNumber
                        value={saldoSemana}
                        formatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="mt-2">
                      {saldoSemana >= 0 ? (
                        <Chip tom="ok">▲ Crédito</Chip>
                      ) : (
                        <Chip tom="erro">▼ Débito</Chip>
                      )}
                    </div>
                  </Surface>
                </div>
              )}

              {/* Saldo Acumulado — linha discreta */}
              <div className="flex items-center gap-sm px-1">
                <span className="text-xs text-ink-500">Saldo acumulado:</span>
                {saldoInicioSemana ? (
                  <span className={`text-xs font-semibold tabular-nums ${saldoAcumulado >= 0 ? 'text-ok' : 'text-bad'}`}>
                    {saldoAcumulado > 0 ? '+' : ''}{saldoAcumulado.toFixed(2).replace('.', ',')}h
                  </span>
                ) : (
                  <span className="text-xs text-ink-500">Configure em Ajustes</span>
                )}
              </div>

              {/* Barra de progresso */}
              <Surface elevacao={1} comBorda padding="nenhum" className="w-full p-4">

                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-ink-500">
                    PROGRESSO DA META
                  </span>
                  <span className="text-xs text-ink-500">
                    Meta: {metaReal.toFixed(2).replace('.', ',')}h ({margemMinima}% de {horasBase.toFixed(2).replace('.', ',')}h)
                  </span>
                </div>

                <div className="relative w-full mt-6 mb-1">

                  <div
                    className="absolute bottom-[calc(100%+6px)] text-xs font-bold transition-[left,color] duration-d4"
                    style={{
                      left: `${Math.min(pctMeta, 100)}%`,
                      transform: 'translateX(-50%)',
                      color: pctMeta < 100 ? 'var(--warn)' : 'var(--ok)'
                    }}
                  >
                    {pctMeta}%
                  </div>

                  {/* Barra */}
                  <div className="relative w-full h-3 bg-surface-0 rounded-full overflow-visible">

                    {/* Preenchimento */}
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full transition-[width,background-color] duration-d4"
                      style={{
                        width: `${Math.min(pctMeta, 100)}%`,
                        backgroundColor: pctMeta < 100 ? 'var(--warn)' : 'var(--ok)'
                      }}
                    />
                  </div>
                </div>

                {/* Texto de status */}
                <div className="mt-3">
                  {pctMeta < 100 ? (
                    <span className="text-xs text-warn">
                      ⚠ Faltam {(metaReal - totalBillable).toFixed(2).replace('.', ',')}h para atingir a meta
                    </span>
                  ) : (
                    <span className="text-xs text-ok">
                      ✓ Meta atingida — +{(totalBillable - metaReal).toFixed(2).replace('.', ',')}h excedido
                    </span>
                  )}
                </div>
              </Surface>

              {/* Navegador de semana */}
              <div className="flex items-center justify-center gap-lg py-2">
                <button
                  type="button"
                  onClick={prevWeek}
                  className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
                  title="Semana anterior"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="w-icon-sm h-icon-sm" />
                </button>
                <div className="overflow-hidden h-6 flex items-center justify-center min-w-[260px]">
                  <span
                    key={animKey}
                    className={`text-base font-bold text-ink-900 select-none ${animationClass}`}
                  >
                    {formatWeekInterval(currentDate)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={nextWeek}
                  className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
                  title="Próxima semana"
                  aria-label="Próxima semana"
                >
                  <ChevronRight className="w-icon-sm h-icon-sm" />
                </button>
              </div>

              {/* Seção B: Grade de projetos */}
              <Surface elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                {loading ? (
                  <div className="flex flex-col">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </div>
                ) : billableProjetos.length === 0 ? (
                  <div className="p-6 text-center max-w-lg mx-auto space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-accent-bg text-accent mb-2">
                      <FileChartColumn className="w-icon-xl h-icon-xl" />
                    </div>
                    <h3 className="text-lg font-bold text-ink-900 font-display">Nenhum projeto billable ativo</h3>
                    <p className="text-sm text-ink-500 leading-relaxed font-ui">
                      Configure projetos com WO e marque como Billable.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/projetos"
                        className="inline-flex items-center justify-center gap-xs rounded-ctl font-medium whitespace-nowrap transition-colors duration-d1 ease-ez focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:border-accent active:translate-y-[0.5px] px-4 py-1.5 text-[13px] bg-pri text-pri-fg font-semibold shadow-e1 hover:bg-pri-hover min-h-[44px]"
                      >
                        Gerenciar Projetos
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[55vh] custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0 whitespace-nowrap min-w-[640px] md:min-w-[800px]">
                      <thead>
                        <tr className="border-b-2 bg-surface-0" style={{ borderBottomColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                          <th className="sticky top-0 left-0 z-30 bg-surface-0 py-4 px-4 text-xs font-bold text-ink-700 uppercase tracking-wider min-w-[130px] md:min-w-[100px]">WO</th>
                          <th className="hidden md:table-cell sticky top-0 z-20 bg-surface-0 py-4 px-4 text-xs font-bold text-ink-700 uppercase tracking-wider w-full">Nome</th>
                          {days.map((d) => (
                            <th key={d.toISOString()} className="sticky top-0 z-20 bg-surface-0 py-4 px-4 text-xs font-bold text-ink-700 uppercase tracking-wider text-right w-20">
                              {LABELS_DIA[d.getDay()]}
                            </th>
                          ))}
                          <th className="sticky top-0 z-20 bg-surface-0 py-4 px-4 text-xs font-bold text-accent uppercase tracking-wider text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hair">
                        {tableData.map((row, index) => {
                          const rowBg = index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0'
                          const rowBgVar = index % 2 === 0 ? 'var(--bg-1)' : 'var(--bg-0)'
                          return (
                            <tr
                              key={row.projetoId}
                              className={`transition-colors duration-d1 ease-ez group ${
                                selectedRow === row.projetoId
                                  ? ''
                                  : `${rowBg} hover:bg-surface-2`
                              }`}
                              style={selectedRow === row.projetoId ? { backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' } : undefined}
                            >
                              <td
                                className={`sticky left-0 z-10 md:static md:z-auto ${rowBg} md:bg-transparent py-3 px-4 font-mono text-sm text-ink-500 tabular-nums cursor-pointer select-none min-w-[130px] md:min-w-[100px]`}
                                style={selectedRow === row.projetoId ? { backgroundColor: `color-mix(in srgb, var(--accent) 20%, ${rowBgVar})` } : undefined}
                                onClick={() => toggleRow(row.projetoId)}
                              >
                                <span className="block text-xs md:text-sm">
                                  {row.codigo}
                                </span>
                                <span className="block md:hidden text-ink-900 font-medium text-sm whitespace-normal break-words leading-tight" title={row.nome}>
                                  {row.nome}
                                </span>
                              </td>
                              <td
                                className="hidden md:table-cell py-3 px-4 text-ink-900 font-medium text-sm truncate max-w-[200px] cursor-pointer select-none"
                                title={row.nome}
                                onClick={() => toggleRow(row.projetoId)}
                              >
                                {row.nome}
                              </td>
                              {row.diasValores.map((dv) =>
                                renderCell(dv.duracao, dv.dataStr, row.projetoId)
                              )}
                              <td className={`py-3 px-4 text-right font-mono text-sm font-semibold tabular-nums ${
                                row.total === 0 ? 'text-ink-500' : 'text-ink-900'
                              }`}>
                                {row.total === 0 ? '—' : row.total.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Linha de Totais */}
                        <tr className="bg-surface-2 border-t-2 border-hair-strong font-semibold">
                          <td className="md:hidden sticky left-0 z-10 bg-surface-2 py-4 px-4 text-right text-xs font-bold text-ink-700 uppercase tracking-wider min-w-[130px]">
                            Total da Semana
                          </td>
                          <td colSpan={2} className="hidden md:table-cell py-4 px-4 text-right text-xs font-bold text-ink-700 uppercase tracking-wider">
                            Total da Semana
                          </td>
                          {totals.dias.map((tot, idx) => (
                            <td key={idx} className={getFooterClass(tot)}>
                              {tot === 0 ? '—' : tot.toFixed(2).replace('.', ',')}
                            </td>
                          ))}
                          <td className={`py-4 px-4 text-right font-mono text-base font-black tabular-nums ${
                            totals.total >= metaReal ? 'text-ok' : 'text-bad'
                          }`}>
                            {totals.total === 0 ? '—' : totals.total.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Surface>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Seção A: Cards de resumo */}
              {loadingMensal ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
                  {[1, 2, 3, 4].map((i) => (
                    <Surface key={i} elevacao={1} comBorda padding="nenhum" className="animate-pulse p-6 h-32 flex flex-col justify-between">
                      <div className="h-3 bg-surface-3 rounded w-2/3" />
                      <div className="h-8 bg-surface-3 rounded w-1/2 mt-4" />
                      <div className="h-3 bg-surface-3 rounded w-1/3 mt-2" />
                    </Surface>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg" key={currentMonth.getTime()}>
                  {/* Card 1 — META DO MÊS */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      META DO MÊS
                    </span>
                    <span className="text-3xl font-bold text-ink-900 tabular-nums mt-2 flex items-baseline gap-sm">
                      <AnimatedNumber
                        value={metaRealMensal}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                      <span className="text-xs text-ink-500 font-normal">
                        ({margemMinimaMensalVal}%)
                      </span>
                    </span>
                    <span className="text-xs text-ink-500">
                      {horasBaseMensalVal.toFixed(2).replace('.', ',')}h base
                    </span>
                  </Surface>

                  {/* Card 2 — HORAS FEITAS */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '60ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      HORAS FEITAS
                    </span>
                    <span className="text-3xl font-bold text-ink-900 tabular-nums mt-2">
                      <AnimatedNumber
                        value={totalBillableMensal}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="h-5" />
                  </Surface>

                  {/* Card 3 — % DA META */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '120ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      % DA META
                    </span>
                    <span className="text-3xl font-bold text-accent tabular-nums mt-2">
                      {metaRealMensal > 0 ? (
                        <AnimatedNumber
                          value={pctMetaMensal}
                          formatter={(v) => `${Math.round(v)}%`}
                        />
                      ) : (
                        "—"
                      )}
                    </span>
                    <div className="h-5" />
                  </Surface>

                  {/* Card 4 — SALDO DO MÊS */}
                  <Surface
                    elevacao={1}
                    comBorda
                    padding="nenhum"
                    className="p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '180ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-ink-500">
                      SALDO DO MÊS
                    </span>
                    <span className={`text-3xl font-bold tabular-nums mt-2 ${saldoMensal >= 0 ? 'text-ok' : 'text-bad'}`}>
                      <AnimatedNumber
                        value={saldoMensal}
                        formatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="mt-2">
                      {saldoMensal >= 0 ? (
                        <Chip tom="ok">▲ Crédito</Chip>
                      ) : (
                        <Chip tom="erro">▼ Débito</Chip>
                      )}
                    </div>
                  </Surface>
                </div>
              )}

              {/* Saldo Acumulado — linha discreta */}
              <div className="flex items-center gap-sm px-1">
                <span className="text-xs text-ink-500">Saldo acumulado:</span>
                {saldoInicioSemana ? (
                  <span className={`text-xs font-semibold tabular-nums ${saldoAcumuladoMensal >= 0 ? 'text-ok' : 'text-bad'}`}>
                    {saldoAcumuladoMensal > 0 ? '+' : ''}{saldoAcumuladoMensal.toFixed(2).replace('.', ',')}h
                  </span>
                ) : (
                  <span className="text-xs text-ink-500">Configure em Ajustes</span>
                )}
              </div>

              {/* Barra de progresso mensal */}
              <Surface elevacao={1} comBorda padding="nenhum" className="w-full p-4">

                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-ink-500">
                    PROGRESSO DA META
                  </span>
                  <span className="text-xs text-ink-500">
                    Meta: {metaRealMensal.toFixed(2).replace('.', ',')}h ({margemMinimaMensalVal}% de {horasBaseMensalVal.toFixed(2).replace('.', ',')}h)
                  </span>
                </div>

                <div className="relative w-full mt-6 mb-1">
                  <div
                    className="absolute bottom-[calc(100%+6px)] text-xs font-bold transition-[left,color] duration-d4"
                    style={{
                      left: `${Math.min(pctMetaMensal, 100)}%`,
                      transform: 'translateX(-50%)',
                      color: pctMetaMensal < 100 ? 'var(--warn)' : 'var(--ok)'
                    }}
                  >
                    {pctMetaMensal}%
                  </div>

                  {/* Barra */}
                  <div className="relative w-full h-3 bg-surface-0 rounded-full overflow-visible">
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full transition-[width,background-color] duration-d4"
                      style={{
                        width: `${Math.min(pctMetaMensal, 100)}%`,
                        backgroundColor: pctMetaMensal < 100 ? 'var(--warn)' : 'var(--ok)'
                      }}
                    />
                  </div>
                </div>

                {/* Texto de status */}
                <div className="mt-3">
                  {pctMetaMensal < 100 ? (
                    <span className="text-xs text-warn">
                      ⚠ Faltam {(metaRealMensal - totalBillableMensal).toFixed(2).replace('.', ',')}h para atingir a meta
                    </span>
                  ) : (
                    <span className="text-xs text-ok">
                      ✓ Meta atingida — +{(totalBillableMensal - metaRealMensal).toFixed(2).replace('.', ',')}h excedido
                    </span>
                  )}
                </div>
              </Surface>

              {/* Navegador de mês */}
              <div className="flex items-center justify-center gap-lg py-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
                  title="Mês anterior"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-icon-sm h-icon-sm" />
                </button>
                <div className="overflow-hidden h-6 flex items-center justify-center min-w-[260px]">
                  <span
                    key={animKeyMonth}
                    className={`text-base font-bold text-ink-900 select-none ${animationClassMonth}`}
                  >
                    {formatMonthYear(currentMonth)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
                  title="Próximo mês"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-icon-sm h-icon-sm" />
                </button>
              </div>

              {/* Seção B: Grade de projetos */}
              <Surface elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                {loadingMensal ? (
                  <div className="flex flex-col">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </div>
                ) : billableProjetosMensal.length === 0 ? (
                  <div className="p-6 text-center max-w-lg mx-auto space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-accent-bg text-accent mb-2">
                      <FileChartColumn className="w-icon-xl h-icon-xl" />
                    </div>
                    <h3 className="text-lg font-bold text-ink-900 font-display">Nenhum projeto billable ativo</h3>
                    <p className="text-sm text-ink-500 leading-relaxed font-ui">
                      Configure projetos com WO e marque como Billable.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/projetos"
                        className="inline-flex items-center justify-center gap-xs rounded-ctl font-medium whitespace-nowrap transition-colors duration-d1 ease-ez focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:border-accent active:translate-y-[0.5px] px-4 py-1.5 text-[13px] bg-pri text-pri-fg font-semibold shadow-e1 hover:bg-pri-hover min-h-[44px]"
                      >
                        Gerenciar Projetos
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[55vh] custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0 whitespace-nowrap min-w-[640px] md:min-w-[800px]">
                      <thead>
                        <tr className="border-b-2 bg-surface-0" style={{ borderBottomColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                          <th className="sticky top-0 left-0 z-30 bg-surface-0 py-4 px-4 text-xs font-bold text-ink-700 uppercase tracking-wider min-w-[130px] md:min-w-[100px]">WO</th>
                          <th className="hidden md:table-cell sticky top-0 z-20 bg-surface-0 py-4 px-4 text-xs font-bold text-ink-700 uppercase tracking-wider w-full">Nome</th>
                          {weeksSorted.map((sem, idx) => (
                            <th key={sem} className="sticky top-0 z-20 bg-surface-0 py-4 px-4 text-xs font-bold text-ink-700 uppercase tracking-wider text-right w-28">Semana {idx + 1}</th>
                          ))}
                          <th className="sticky top-0 z-20 bg-surface-0 py-4 px-4 text-xs font-bold text-accent uppercase tracking-wider text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hair">
                        {tableDataMensal.map((row, index) => {
                          const rowBg = index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0'
                          const rowBgVar = index % 2 === 0 ? 'var(--bg-1)' : 'var(--bg-0)'
                          return (
                            <tr
                              key={row.projetoId}
                              className={`transition-colors duration-d1 ease-ez group ${
                                selectedRow === row.projetoId
                                  ? ''
                                  : `${rowBg} hover:bg-surface-2`
                              }`}
                              style={selectedRow === row.projetoId ? { backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' } : undefined}
                            >
                              <td
                                className={`sticky left-0 z-10 md:static md:z-auto ${rowBg} md:bg-transparent py-3 px-4 font-mono text-sm text-ink-500 tabular-nums cursor-pointer select-none min-w-[130px] md:min-w-[100px]`}
                                style={selectedRow === row.projetoId ? { backgroundColor: `color-mix(in srgb, var(--accent) 20%, ${rowBgVar})` } : undefined}
                                onClick={() => toggleRow(row.projetoId)}
                              >
                                <span className="block text-xs md:text-sm">
                                  {row.codigo}
                                </span>
                                <span className="block md:hidden text-ink-900 font-medium text-sm whitespace-normal break-words leading-tight" title={row.nome}>
                                  {row.nome}
                                </span>
                              </td>
                              <td
                                className="hidden md:table-cell py-3 px-4 text-ink-900 font-medium text-sm truncate max-w-[200px] cursor-pointer select-none"
                                title={row.nome}
                                onClick={() => toggleRow(row.projetoId)}
                              >
                                {row.nome}
                              </td>
                              {row.semanasValores.map((val, idx) =>
                                renderCellMensal(val, weeksSorted[idx], row.projetoId)
                              )}
                              <td className={`py-3 px-4 text-right font-mono text-sm font-semibold tabular-nums ${
                                row.total === 0 ? 'text-ink-500' : 'text-ink-900'
                              }`}>
                                {row.total === 0 ? '—' : row.total.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Linha de Totais */}
                        <tr className="bg-surface-2 border-t-2 border-hair-strong font-semibold">
                          <td className="md:hidden sticky left-0 z-10 bg-surface-2 py-4 px-4 text-right text-xs font-bold text-ink-700 uppercase tracking-wider min-w-[130px]">
                            Total do Mês
                          </td>
                          <td colSpan={2} className="hidden md:table-cell py-4 px-4 text-right text-xs font-bold text-ink-700 uppercase tracking-wider">
                            Total do Mês
                          </td>
                          {totalsMensal.semanas.map((tot, idx) => (
                            <td key={idx} className={getFooterClassMensal(tot)}>
                              {tot === 0 ? '—' : tot.toFixed(2).replace('.', ',')}
                            </td>
                          ))}
                          <td className={`py-4 px-4 text-right font-mono text-base font-black tabular-nums ${
                            totalsMensal.total >= metaMensal ? 'text-ok' : 'text-bad'
                          }`}>
                            {totalsMensal.total === 0 ? '—' : totalsMensal.total.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Surface>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
