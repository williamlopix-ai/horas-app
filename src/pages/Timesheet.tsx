import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link, useLocation } from 'react-router-dom'
import { listarProjetos } from '../services/projetos'
import { listarRegistros } from '../services/registros'
import { getErrorMessage } from '../utils/errors'
import type { Projeto, Registro } from '../types'
import { SkeletonRow } from '../components/Skeleton'

// Funções auxiliares de data
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

  return `Seg ${m1}/${m2} a Dom ${s1}/${s2}`;
}

function formatDuracao(duracao: number) {
  if (duracao === 0) return '—';
  return duracao.toFixed(2).replace('.', ',');
}

export default function Timesheet() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentDate, setCurrentDate] = useState<Date>(() => getMonday(new Date()))
  const [filtroCodigo, setFiltroCodigo] = useState('')

  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const projs = await listarProjetos(user.id, false)
      setProjetos(projs.filter(p => p.status === 'ativo' && p.codigo_externo && p.codigo_externo.trim() !== ''))

      const sunday = new Date(currentDate)
      sunday.setDate(currentDate.getDate() + 6)

      const regs = await listarRegistros(user.id)

      const startStr = formatYYYYMMDD(currentDate)
      const endStr = formatYYYYMMDD(sunday)

      const regsSemana = regs.filter(r => r.data >= startStr && r.data <= endStr)
      setRegistros(regsSemana)

    } catch (err: any) {
      console.error('Erro ao carregar timesheet:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user, currentDate])

  const prevWeek = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  const nextWeek = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
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
    const query = filtroCodigo.trim().toLowerCase()
    const filteredProjetos = query
      ? projetos.filter(p => p.codigo_externo?.toLowerCase().includes(query))
      : projetos

    const rows = filteredProjetos.map(p => {
      const rowRegs = registros.filter(r => r.projeto_id === p.id)

      const getDuracao = (date: Date) => {
        const dStr = formatYYYYMMDD(date)
        return rowRegs.filter(r => r.data === dStr).reduce((acc, r) => acc + r.duracao, 0)
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
        projetoId: p.id,
        codigo: p.codigo_externo,
        nome: p.nome,
        seg, ter, qua, qui, sex, sab, dom, total
      }
    })

    return rows.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
  }, [projetos, registros, days, filtroCodigo])

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

  const handleCopy = () => {
    let text = "Código\tNome\tSáb\tDom\tSeg\tTer\tQua\tQui\tSex\tTotal\n"

    tableData.forEach(row => {
      text += `${row.codigo}\t${row.nome}\t${row.sab.toFixed(2).replace('.', ',')}\t${row.dom.toFixed(2).replace('.', ',')}\t${row.seg.toFixed(2).replace('.', ',')}\t${row.ter.toFixed(2).replace('.', ',')}\t${row.qua.toFixed(2).replace('.', ',')}\t${row.qui.toFixed(2).replace('.', ',')}\t${row.sex.toFixed(2).replace('.', ',')}\t${row.total.toFixed(2).replace('.', ',')}\n`
    })

    navigator.clipboard.writeText(text)
      .then(() => showToast('Grade copiada!', 'success'))
      .catch(() => showToast('Erro ao copiar grade.', 'error'))
  }

  const renderCell = (duracao: number, _dateStr: string, _projetoId: string) => {
    let className = "py-3 px-4 text-center font-mono text-sm font-semibold border-x border-gray-800/30 transition-colors "

    if (duracao === 0) {
      className += "text-gray-500"
    } else {
      className += "text-white"
    }

    // Fase 2: <Link to={`/registros?data=${dateStr}&projeto_id=${projetoId}`} className={className}>{formatDuracao(duracao)}</Link>
    return (
      <td className={className}>
        {formatDuracao(duracao)}
      </td>
    )
  }

  const getFooterClass = (duracao: number) => {
    let className = "py-4 px-4 text-center font-mono text-sm font-bold border-x border-gray-800/30 "
    if (duracao === 0) {
      className += "text-gray-500"
    } else if (duracao > 0 && duracao < 8.5) {
      className += "text-red-400"
    } else {
      className += "text-emerald-400"
    }
    return className
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col lg:flex-row">

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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Timesheet</h2>
            <p className="text-sm text-gray-400">Grade semanal para preenchimento de horas no sistema externo.</p>
          </div>
          <button
            onClick={handleCopy}
            disabled={loading || tableData.length === 0}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-sm font-bold rounded-xl transition-all border border-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copiar Grade
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

        {/* Navegação Semanal e Filtro por Código */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161B22] border border-gray-800 rounded-2xl p-4">
          {/* Filtro por Código */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Filtrar por código..."
              value={filtroCodigo}
              onChange={(e) => setFiltroCodigo(e.target.value)}
              className="bg-[#0B0E14] border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#FFFFFF] placeholder-[#8B949E] focus:outline-none focus:border-[#03A9F4] w-full"
            />
            {filtroCodigo && (
              <button
                type="button"
                onClick={() => setFiltroCodigo('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-lg"
                title="Limpar filtro"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navegação Semanal */}
          <div className="flex items-center justify-center gap-4 w-full md:w-auto md:flex-1 md:justify-center">
            <button onClick={prevWeek} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-base font-bold text-white min-w-[200px] text-center select-none">
              {formatWeekInterval(currentDate)}
            </span>
            <button onClick={nextWeek} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Espaçador para centralizar a navegação no desktop */}
          <div className="hidden md:block w-72" />
        </div>

        {/* Tabela ou Estado Vazio */}
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col">
              {[1, 2, 3].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : projetos.length === 0 ? (
            <div className="p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Nenhum projeto apto para timesheet</h3>
              <p className="text-sm text-gray-400">
                Para um projeto aparecer aqui, ele deve estar <strong>ativo</strong> e possuir o <strong>código externo</strong> preenchido.
              </p>
              <Link
                to="/projetos"
                className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Gerenciar Projetos
              </Link>
            </div>
          ) : tableData.length === 0 ? (
            <div className="p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Nenhum resultado encontrado</h3>
              <p className="text-sm text-gray-400">
                Não encontramos nenhum projeto com o código "{filtroCodigo}".
              </p>
              <button
                onClick={() => setFiltroCodigo('')}
                className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Limpar Filtro
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="border-b-2 border-gray-800 bg-gray-900/30">
                    <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[100px]">Código</th>
                    <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-full">Nome</th>
                    <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-20">Sáb</th>
                    <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-20">Dom</th>
                    <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Seg</th>
                    <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Ter</th>
                    <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Qua</th>
                    <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Qui</th>
                    <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Sex</th>
                    <th className="py-4 px-4 text-xs font-bold text-[#03A9F4] uppercase tracking-wider text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {tableData.map((row) => (
                    <tr key={row.projetoId} className="hover:bg-[#1E2530]/40 transition-colors group">
                      <td className="py-3 px-4 font-mono text-sm text-gray-300">
                        {row.codigo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white truncate max-w-[200px]" title={row.nome}>
                        {row.nome}
                      </td>
                      {renderCell(row.sab, formatYYYYMMDD(days[5]), row.projetoId)}
                      {renderCell(row.dom, formatYYYYMMDD(days[6]), row.projetoId)}
                      {renderCell(row.seg, formatYYYYMMDD(days[0]), row.projetoId)}
                      {renderCell(row.ter, formatYYYYMMDD(days[1]), row.projetoId)}
                      {renderCell(row.qua, formatYYYYMMDD(days[2]), row.projetoId)}
                      {renderCell(row.qui, formatYYYYMMDD(days[3]), row.projetoId)}
                      {renderCell(row.sex, formatYYYYMMDD(days[4]), row.projetoId)}
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatDuracao(row.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Linha de Totais */}
                  <tr className="bg-gray-900/40 border-t-2 border-gray-800">
                    <td colSpan={2} className="py-4 px-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Total da Semana
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-sm font-bold text-gray-300 border-x border-gray-800/30">{formatDuracao(totals.sab)}</td>
                    <td className="py-4 px-4 text-center font-mono text-sm font-bold text-gray-300 border-x border-gray-800/30">{formatDuracao(totals.dom)}</td>
                    <td className={getFooterClass(totals.seg)}>{formatDuracao(totals.seg)}</td>
                    <td className={getFooterClass(totals.ter)}>{formatDuracao(totals.ter)}</td>
                    <td className={getFooterClass(totals.qua)}>{formatDuracao(totals.qua)}</td>
                    <td className={getFooterClass(totals.qui)}>{formatDuracao(totals.qui)}</td>
                    <td className={getFooterClass(totals.sex)}>{formatDuracao(totals.sex)}</td>
                    <td className="py-4 px-4 text-right font-mono text-base font-black text-[#03A9F4]">
                      {formatDuracao(totals.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
