import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link, useLocation } from 'react-router-dom'
import { getErrorMessage } from '../utils/errors'
import { 
  buscarHorasBillableSemanal, 
  buscarTotalBillableSemanal, 
  buscarHorasBillableMensal, 
  buscarTotalBillableMensal, 
  type BillablePorProjeto, 
  type BillablePorProjetoMensal 
} from '../services/billable'
import { buscarMetaBillableSemanal, buscarMetaBillableMensal } from '../services/metas_billable'
import { SkeletonRow } from '../components/Skeleton'

// Helper functions for week/month start date and formatting
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatWeekInterval(monday: Date) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const m1 = String(monday.getDate()).padStart(2, '0');
  const m2 = String(monday.getMonth() + 1).padStart(2, '0');
  const s1 = String(sunday.getDate()).padStart(2, '0');
  const s2 = String(sunday.getMonth() + 1).padStart(2, '0');
  const sYear = sunday.getFullYear();

  return `Seg ${m1}/${m2} – Dom ${s1}/${s2}/${sYear}`;
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

function AnimatedNumber({ value, formatter, duration = 400 }: AnimatedNumberProps) {
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

export default function Billable() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'semanal' | 'mensal'>('semanal')
  const [currentDate, setCurrentDate] = useState<Date>(() => getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

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
  const [metaSemanal, setMetaSemanal] = useState(40)
  const [metaMensal, setMetaMensal] = useState(160)

  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const startStr = formatYYYYMMDD(currentDate)
      const sunday = new Date(currentDate)
      sunday.setDate(currentDate.getDate() + 6)
      const endStr = formatYYYYMMDD(sunday)

      const [projetosData, totalBillableData, metaData] = await Promise.all([
        buscarHorasBillableSemanal(startStr, endStr),
        buscarTotalBillableSemanal(startStr, endStr),
        buscarMetaBillableSemanal(startStr)
      ])

      setBillableProjetos(projetosData)
      setTotalBillable(totalBillableData)
      setMetaSemanal(metaData)
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

      const [projetosData, totalBillableData, metaData, metaSemanalData] = await Promise.all([
        buscarHorasBillableMensal(mesInicio, mesFim),
        buscarTotalBillableMensal(mesInicio, mesFim),
        buscarMetaBillableMensal(mesInicio),
        buscarMetaBillableSemanal(mesInicio)
      ])

      setBillableProjetosMensal(projetosData)
      setTotalBillableMensal(totalBillableData)
      setMetaMensal(metaData)
      setMetaSemanal(metaSemanalData)
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
  }, [user, currentDate])

  useEffect(() => {
    if (activeTab === 'mensal') {
      carregarDadosMensal()
    }
  }, [user, currentMonth, activeTab])

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
    const d = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate)
      date.setDate(currentDate.getDate() + i)
      d.push(date)
    }
    return d
  }, [currentDate])

  const tableData = useMemo(() => {
    const rows = billableProjetos.map(p => {
      const getDuracao = (date: Date) => {
        const dStr = formatYYYYMMDD(date)
        return p.horas_por_dia[dStr] || 0
      }

      const seg = getDuracao(days[0])
      const ter = getDuracao(days[1])
      const qua = getDuracao(days[2])
      const qui = getDuracao(days[3])
      const sex = getDuracao(days[4])
      const sab = getDuracao(days[5])
      const dom = getDuracao(days[6])

      const total = seg + ter + qua + qui + sex + sab + dom

      return {
        projetoId: p.projeto_id,
        codigo: p.codigo_externo,
        nome: p.nome,
        seg, ter, qua, qui, sex, sab, dom, total
      }
    })

    // Sort by code (codigo_externo) ascending
    return rows.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
  }, [billableProjetos, days])

  const totals = useMemo(() => {
    return tableData.reduce((acc, row) => ({
      seg: acc.seg + row.seg,
      ter: acc.ter + row.ter,
      qua: acc.qua + row.qua,
      qui: acc.qui + row.qui,
      sex: acc.sex + row.sex,
      sab: acc.sab + row.sab,
      dom: acc.dom + row.dom,
      total: acc.total + row.total
    }), { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0, total: 0 })
  }, [tableData])

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
    return rows.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
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

  const pctTotal = metaSemanal > 0 ? Math.round((totalBillable / metaSemanal) * 100) : 0
  const isMetaAtingida = totalBillable >= metaSemanal
  const diffValue = isMetaAtingida ? totalBillable - metaSemanal : metaSemanal - totalBillable

  const pctTotalMensal = metaMensal > 0 ? Math.round((totalBillableMensal / metaMensal) * 100) : 0
  const diffValueMensal = totalBillableMensal >= metaMensal ? totalBillableMensal - metaMensal : metaMensal - totalBillableMensal
  const isMetaAtingidaMensal = totalBillableMensal >= metaMensal

  const formatCard4 = (val: number) => {
    if (Math.abs(totalBillable - metaSemanal) < 0.001) {
      return '0,00h'
    }
    if (isMetaAtingida) {
      return `+ ${val.toFixed(2).replace('.', ',')}h excedido`
    } else {
      return `${val.toFixed(2).replace('.', ',')}h`
    }
  }

  const formatCard4Mensal = (val: number) => {
    if (Math.abs(totalBillableMensal - metaMensal) < 0.001) {
      return '0,00h'
    }
    if (isMetaAtingidaMensal) {
      return `+ ${val.toFixed(2).replace('.', ',')}h excedido`
    } else {
      return `${val.toFixed(2).replace('.', ',')}h`
    }
  }

  const renderCell = (duracao: number, dateStr: string, projetoId: string) => {
    if (duracao === 0) {
      return (
        <td className="py-3 px-4 text-sm text-right text-[#8B949E] font-mono border-x border-gray-800/30">
          —
        </td>
      )
    }
    return (
      <td className="py-3 px-4 text-sm text-right text-white font-mono border-x border-gray-800/30 font-semibold">
        <Link
          to={`/registros?data=${dateStr}&projeto_id=${projetoId}`}
          className="hover:text-[#03A9F4] transition-colors"
        >
          {duracao.toFixed(2).replace('.', ',')}
        </Link>
      </td>
    )
  }

  const renderCellMensal = (duracao: number, semanaStr: string, projetoId: string) => {
    if (duracao === 0) {
      return (
        <td className="py-3 px-4 text-sm text-right text-[#8B949E] font-mono border-x border-gray-800/30">
          —
        </td>
      )
    }
    return (
      <td className="py-3 px-4 text-sm text-right text-white font-mono border-x border-gray-800/30 font-semibold">
        <Link
          to={`/registros?semana_inicio=${semanaStr}&projeto_id=${projetoId}`}
          className="hover:text-[#03A9F4] transition-colors"
        >
          {duracao.toFixed(2).replace('.', ',')}
        </Link>
      </td>
    )
  }

  const getFooterClass = (duracao: number) => {
    let className = "py-4 px-4 text-right font-mono text-sm font-bold border-x border-gray-800/30 "
    if (duracao === 0) {
      className += "text-[#8B949E]"
    } else if (duracao > 0 && duracao < 8.5) {
      className += "text-[#F44336]"
    } else {
      className += "text-[#4CAF50]"
    }
    return className
  }

  const getFooterClassMensal = (duracao: number) => {
    let className = "py-4 px-4 text-right font-mono text-sm font-bold border-x border-gray-800/30 "
    const threshold = metaSemanal / 4
    if (duracao === 0) {
      className += "text-[#8B949E]"
    } else if (duracao > 0 && duracao < threshold) {
      className += "text-[#F44336]"
    } else {
      className += "text-[#4CAF50]"
    }
    return className
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col lg:flex-row">
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

      {/* Header Mobile */}
      <header className="lg:hidden bg-[#161B22] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors focus:outline-none"
            aria-label="Abrir menu"
          >
            <span className="text-2xl">☰</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#03A9F4]/10 text-[#03A9F4]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">HORAS</span>
          </div>
        </div>
      </header>

      {/* Overlay escuro no mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#161B22] border-r border-gray-800 flex flex-col shrink-0 min-h-screen transition-transform duration-300 transform lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:left-0 lg:top-0 lg:bottom-0`}>
        <div className="p-6 border-b border-gray-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#03A9F4]/10 text-[#03A9F4]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HORAS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            to="/registros"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isActive('/registros')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E2530]'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Registros
          </Link>

          <Link
            to="/resumo"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isActive('/resumo')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E2530]'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumo
          </Link>

          <Link
            to="/timesheet"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isActive('/timesheet')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E2530]'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Timesheet
          </Link>

          <Link
            to="/billable"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isActive('/billable')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E2530]'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Billable
          </Link>

          <Link
            to="/projetos"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isActive('/projetos')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E2530]'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Projetos
          </Link>

          <Link
            to="/ajustes"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isActive('/ajustes')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E2530]'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ajustes
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800/80 flex flex-col gap-2">
          <div className="px-2 py-1">
            <span className="block text-xs text-gray-500 font-semibold truncate">{user?.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        {/* Header da Seção */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Billable</h2>
          <p className="text-sm text-gray-400">Visão geral e metas de horas faturáveis da semana.</p>
        </div>

        {/* Abas no topo */}
        <div className="flex border-b border-gray-800 gap-6 mt-4">
          <button
            onClick={() => setActiveTab('semanal')}
            className={`pb-3 text-sm font-semibold relative transition-colors duration-200 ${
              activeTab === 'semanal' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Semanal
            {activeTab === 'semanal' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#03A9F4] transition-all duration-200" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mensal')}
            className={`pb-3 text-sm font-semibold relative transition-colors duration-200 ${
              activeTab === 'mensal' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensal
            {activeTab === 'mensal' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#03A9F4] transition-all duration-200" />
            )}
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="mt-6">
          {activeTab === 'semanal' ? (
            <div className="space-y-6 animate-fade-in">
              {/* Seção A: Cards de resumo */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse bg-[#161B22] rounded-xl p-6 h-32 border border-gray-800/50 flex flex-col justify-between">
                      <div className="h-3 bg-gray-800 rounded w-2/3" />
                      <div className="h-8 bg-gray-800 rounded w-1/2 mt-4" />
                      <div className="h-3 bg-gray-800 rounded w-1/3 mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" key={currentDate.getTime()}>
                  {/* Card 1 — Total Billable */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      TOTAL BILLABLE
                    </span>
                    <span className="text-3xl font-bold text-white mt-2">
                      <AnimatedNumber
                        value={totalBillable}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="h-5" />
                  </div>

                  {/* Card 2 — % da Meta */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '60ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      % DA META
                    </span>
                    <span className="text-3xl font-bold text-[#03A9F4] mt-2">
                      <AnimatedNumber
                        value={pctTotal}
                        formatter={(v) => `${Math.round(v)}%`}
                      />
                    </span>
                    <div className="h-5" />
                  </div>

                  {/* Card 3 — Meta Atingida */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '120ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      META SEMANAL
                    </span>
                    <span className="text-3xl font-bold text-white mt-2">
                      <AnimatedNumber
                        value={metaSemanal}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="mt-2">
                      {isMetaAtingida ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4CAF50]/10 text-[#4CAF50]">
                          ✓ Atingida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F44336]/10 text-[#F44336]">
                          ⚠ Não atingida
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 4 — Horas Faltantes */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '180ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      FALTAM
                    </span>
                    <span className={`text-3xl font-bold mt-2 ${
                      Math.abs(totalBillable - metaSemanal) < 0.001
                        ? 'text-[#8B949E]'
                        : isMetaAtingida
                          ? 'text-[#4CAF50]'
                          : 'text-[#F44336]'
                    }`}>
                      <AnimatedNumber
                        value={diffValue}
                        formatter={formatCard4}
                      />
                    </span>
                    <div className="h-5" />
                  </div>
                </div>
              )}

              {/* Navegador de semana */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={prevWeek}
                  className="p-1.5 hover:bg-[#161B22] rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="overflow-hidden h-6 flex items-center justify-center min-w-[260px]">
                  <span
                    key={animKey}
                    className={`text-base font-bold text-white select-none ${animationClass}`}
                  >
                    {formatWeekInterval(currentDate)}
                  </span>
                </div>
                <button
                  onClick={nextWeek}
                  className="p-1.5 hover:bg-[#161B22] rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Seção B: Grade de projetos */}
              <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                  <div className="flex flex-col">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </div>
                ) : billableProjetos.length === 0 ? (
                  <div className="p-12 text-center max-w-lg mx-auto space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Nenhum projeto billable ativo</h3>
                    <p className="text-sm text-gray-400">
                      Configure projetos com WO e marque como Billable.
                    </p>
                    <Link
                      to="/projetos"
                      className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      Gerenciar Projetos
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-800 bg-[#161B22] text-xs uppercase text-[#8B949E] tracking-wider">
                          <th className="py-4 px-4 font-bold min-w-[100px]">WO</th>
                          <th className="py-4 px-4 font-bold w-full">Nome</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Seg</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Ter</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Qua</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Qui</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Sex</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Sáb</th>
                          <th className="py-4 px-4 font-bold text-right w-20">Dom</th>
                          <th className="py-4 px-4 font-bold text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {tableData.map((row, index) => {
                          const rowBg = index % 2 === 0 ? 'bg-[#161B22]' : 'bg-[#0F1419]'
                          return (
                            <tr key={row.projetoId} className={`${rowBg} hover:bg-[#1A2332] transition-colors group`}>
                              <td className="py-3 px-4 font-mono text-sm text-[#8B949E]">
                                {row.codigo}
                              </td>
                              <td className="py-3 px-4 text-white font-medium text-sm truncate max-w-[200px]" title={row.nome}>
                                {row.nome}
                                <span className="bg-[#03A9F4]/10 text-[#03A9F4] text-[10px] font-bold rounded-full px-2 py-0.5 ml-2 tracking-wider">
                                  BILLABLE
                                </span>
                              </td>
                              {renderCell(row.seg, formatYYYYMMDD(days[0]), row.projetoId)}
                              {renderCell(row.ter, formatYYYYMMDD(days[1]), row.projetoId)}
                              {renderCell(row.qua, formatYYYYMMDD(days[2]), row.projetoId)}
                              {renderCell(row.qui, formatYYYYMMDD(days[3]), row.projetoId)}
                              {renderCell(row.sex, formatYYYYMMDD(days[4]), row.projetoId)}
                              {renderCell(row.sab, formatYYYYMMDD(days[5]), row.projetoId)}
                              {renderCell(row.dom, formatYYYYMMDD(days[6]), row.projetoId)}
                              <td className={`py-3 px-4 text-right font-mono text-sm font-semibold ${
                                row.total > 0 ? 'text-[#4CAF50]' : 'text-[#8B949E]'
                              }`}>
                                {row.total === 0 ? '—' : row.total.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Linha de Totais */}
                        <tr className="bg-[#1E2A38] border-t-2 border-gray-800 font-semibold">
                          <td colSpan={2} className="py-4 px-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Total da Semana
                          </td>
                          <td className={getFooterClass(totals.seg)}>{totals.seg === 0 ? '—' : totals.seg.toFixed(2).replace('.', ',')}</td>
                          <td className={getFooterClass(totals.ter)}>{totals.ter === 0 ? '—' : totals.ter.toFixed(2).replace('.', ',')}</td>
                          <td className={getFooterClass(totals.qua)}>{totals.qua === 0 ? '—' : totals.qua.toFixed(2).replace('.', ',')}</td>
                          <td className={getFooterClass(totals.qui)}>{totals.qui === 0 ? '—' : totals.qui.toFixed(2).replace('.', ',')}</td>
                          <td className={getFooterClass(totals.sex)}>{totals.sex === 0 ? '—' : totals.sex.toFixed(2).replace('.', ',')}</td>
                          <td className={getFooterClass(totals.sab)}>{totals.sab === 0 ? '—' : totals.sab.toFixed(2).replace('.', ',')}</td>
                          <td className={getFooterClass(totals.dom)}>{totals.dom === 0 ? '—' : totals.dom.toFixed(2).replace('.', ',')}</td>
                          <td className={`py-4 px-4 text-right font-mono text-base font-black ${
                            totals.total >= metaSemanal ? 'text-[#4CAF50]' : 'text-[#F44336]'
                          }`}>
                            {totals.total === 0 ? '—' : totals.total.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Seção A: Cards de resumo */}
              {loadingMensal ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse bg-[#161B22] rounded-xl p-6 h-32 border border-gray-800/50 flex flex-col justify-between">
                      <div className="h-3 bg-gray-800 rounded w-2/3" />
                      <div className="h-8 bg-gray-800 rounded w-1/2 mt-4" />
                      <div className="h-3 bg-gray-800 rounded w-1/3 mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" key={currentMonth.getTime()}>
                  {/* Card 1 — Total Billable */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      TOTAL BILLABLE
                    </span>
                    <span className="text-3xl font-bold text-white mt-2">
                      <AnimatedNumber
                        value={totalBillableMensal}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="h-5" />
                  </div>

                  {/* Card 2 — % da Meta */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '60ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      % DA META
                    </span>
                    <span className="text-3xl font-bold text-[#03A9F4] mt-2">
                      <AnimatedNumber
                        value={pctTotalMensal}
                        formatter={(v) => `${Math.round(v)}%`}
                      />
                    </span>
                    <div className="h-5" />
                  </div>

                  {/* Card 3 — Meta Mensal */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '120ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      META MENSAL
                    </span>
                    <span className="text-3xl font-bold text-white mt-2">
                      <AnimatedNumber
                        value={metaMensal}
                        formatter={(v) => `${v.toFixed(2).replace('.', ',')}h`}
                      />
                    </span>
                    <div className="mt-2">
                      {isMetaAtingidaMensal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4CAF50]/10 text-[#4CAF50]">
                          ✓ Atingida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F44336]/10 text-[#F44336]">
                          ⚠ Não atingida
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 4 — Horas Faltantes */}
                  <div
                    className="bg-[#161B22] border border-[#1E2A38] rounded-xl p-6 flex flex-col justify-between h-32 animate-card-entry opacity-0"
                    style={{ animationDelay: '180ms' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-[#8B949E]">
                      FALTAM
                    </span>
                    <span className={`text-3xl font-bold mt-2 ${
                      Math.abs(totalBillableMensal - metaMensal) < 0.001
                        ? 'text-[#8B949E]'
                        : isMetaAtingidaMensal
                          ? 'text-[#4CAF50]'
                          : 'text-[#F44336]'
                    }`}>
                      <AnimatedNumber
                        value={diffValueMensal}
                        formatter={formatCard4Mensal}
                      />
                    </span>
                    <div className="h-5" />
                  </div>
                </div>
              )}

              {/* Navegador de mês */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-[#161B22] rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="overflow-hidden h-6 flex items-center justify-center min-w-[260px]">
                  <span
                    key={animKeyMonth}
                    className={`text-base font-bold text-white select-none ${animationClassMonth}`}
                  >
                    {formatMonthYear(currentMonth)}
                  </span>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-[#161B22] rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Seção B: Grade de projetos */}
              <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {loadingMensal ? (
                  <div className="flex flex-col">
                    {[1, 2, 3].map((i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </div>
                ) : billableProjetosMensal.length === 0 ? (
                  <div className="p-12 text-center max-w-lg mx-auto space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Nenhum projeto billable ativo</h3>
                    <p className="text-sm text-gray-400">
                      Configure projetos com WO e marque como Billable.
                    </p>
                    <Link
                      to="/projetos"
                      className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      Gerenciar Projetos
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-800 bg-[#161B22] text-xs uppercase text-[#8B949E] tracking-wider">
                          <th className="py-4 px-4 font-bold min-w-[100px]">WO</th>
                          <th className="py-4 px-4 font-bold w-full">Nome</th>
                          {weeksSorted.map((sem, idx) => (
                            <th key={sem} className="py-4 px-4 font-bold text-right w-28">Semana {idx + 1}</th>
                          ))}
                          <th className="py-4 px-4 font-bold text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {tableDataMensal.map((row, index) => {
                          const rowBg = index % 2 === 0 ? 'bg-[#161B22]' : 'bg-[#0F1419]'
                          return (
                            <tr key={row.projetoId} className={`${rowBg} hover:bg-[#1A2332] transition-colors group`}>
                              <td className="py-3 px-4 font-mono text-sm text-[#8B949E]">
                                {row.codigo}
                              </td>
                              <td className="py-3 px-4 text-white font-medium text-sm truncate max-w-[200px]" title={row.nome}>
                                {row.nome}
                                <span className="bg-[#03A9F4]/10 text-[#03A9F4] text-[10px] font-bold rounded-full px-2 py-0.5 ml-2 tracking-wider">
                                  BILLABLE
                                </span>
                              </td>
                              {row.semanasValores.map((val, idx) => 
                                renderCellMensal(val, weeksSorted[idx], row.projetoId)
                              )}
                              <td className={`py-3 px-4 text-right font-mono text-sm font-semibold ${
                                row.total > 0 ? 'text-[#4CAF50]' : 'text-[#8B949E]'
                              }`}>
                                {row.total === 0 ? '—' : row.total.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Linha de Totais */}
                        <tr className="bg-[#1E2A38] border-t-2 border-gray-800 font-semibold">
                          <td colSpan={2} className="py-4 px-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Total do Mês
                          </td>
                          {totalsMensal.semanas.map((tot, idx) => (
                            <td key={idx} className={getFooterClassMensal(tot)}>
                              {tot === 0 ? '—' : tot.toFixed(2).replace('.', ',')}
                            </td>
                          ))}
                          <td className={`py-4 px-4 text-right font-mono text-base font-black ${
                            totalsMensal.total >= metaMensal ? 'text-[#4CAF50]' : 'text-[#F44336]'
                          }`}>
                            {totalsMensal.total === 0 ? '—' : totalsMensal.total.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
