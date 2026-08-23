import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { listarProjetos } from '../services/projetos'
import { useConfig } from '../contexts/ConfigContext'
import { listarRegistros } from '../services/registros'
import { buscarHorasBaseSemanal } from '../services/horas_base'
import { getErrorMessage } from '../utils/errors'
import type { Projeto, Registro } from '../types'
import { SkeletonRow } from '../components/Skeleton'
import { inicioDaSemanaDate, diasDaSemana, formatYYYYMMDD, type InicioSemana } from '../utils/semana'
import { Copy, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui'

// Funções auxiliares de data
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

  return `${ds1} ${m1}/${m2} a ${ds2} ${s1}/${s2}`;
}

function formatDuracao(duracao: number) {
  if (duracao === 0) return '—';
  return duracao.toFixed(2).replace('.', ',');
}

function formatMeta(val: number): string {
  return Number(val.toFixed(2)).toString().replace('.', ',');
}

export default function Timesheet() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { config } = useConfig()

  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [metaSemanaExibida, setMetaSemanaExibida] = useState<number>(config.meta_semanal)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentDate, setCurrentDate] = useState<Date>(() => getInicioSemana(new Date(), 'segunda'))
  const [filtroCodigo, setFiltroCodigo] = useState('')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  const toggleRow = (id: string) =>
    setSelectedRow(prev => (prev === id ? null : id))

  const metaDiaria = metaSemanaExibida / 5

  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const projs = await listarProjetos(user.id, false)
      setProjetos(projs.filter(p => p.status !== 'excluido' && p.codigo_externo && p.codigo_externo.trim() !== ''))

      const sunday = new Date(currentDate)
      sunday.setDate(currentDate.getDate() + 6)

      const startStr = formatYYYYMMDD(currentDate)
      const endStr = formatYYYYMMDD(sunday)

      const [regs, baseSemanal] = await Promise.all([
        listarRegistros(user.id),
        buscarHorasBaseSemanal(user.id, startStr)
      ])

      const regsSemana = regs.filter(r => r.data >= startStr && r.data <= endStr)
      setRegistros(regsSemana)
      setMetaSemanaExibida(baseSemanal ?? config.meta_semanal)

    } catch (err: any) {
      console.error('Erro ao carregar timesheet:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentDate(getInicioSemana(new Date(), config.inicio_semana))
  }, [config.inicio_semana])

  useEffect(() => {
    carregarDados()
  }, [user, currentDate, config.inicio_semana])

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
    return diasDaSemana(currentDate, config.inicio_semana)
  }, [currentDate, config.inicio_semana])

  const tableData = useMemo(() => {
    const query = filtroCodigo.trim().toLowerCase()
    const filteredProjetos = query
      ? projetos.filter(p => p.codigo_externo?.toLowerCase().includes(query))
      : projetos

    const rows = filteredProjetos.map(p => {
      const rowRegs = registros.filter(r => r.projeto_id === p.id)

      const porDow = (dow: number) => {
        const dia = days.find(d => d.getDay() === dow)
        if (!dia) return 0
        const dStr = formatYYYYMMDD(dia)
        return rowRegs.filter(r => r.data === dStr).reduce((acc, r) => acc + r.duracao, 0)
      }

      const dom = porDow(0)
      const seg = porDow(1)
      const ter = porDow(2)
      const qua = porDow(3)
      const qui = porDow(4)
      const sex = porDow(5)
      const sab = porDow(6)

      const total = seg + ter + qua + qui + sex + sab + dom

      return {
        projetoId: p.id,
        codigo: p.codigo_externo,
        nome: p.nome,
        seg, ter, qua, qui, sex, sab, dom, total
      }
    })

    return rows
      .filter(r => r.total > 0)
      .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
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

  const renderCell = (duracao: number, dateStr: string, projetoId: string) => {
    let className = "py-3 px-4 text-center font-mono text-sm font-semibold border-x border-gray-800/30 transition-colors "

    if (duracao === 0) {
      className += "text-gray-500"
      return (
        <td className={className}>
          {formatDuracao(duracao)}
        </td>
      )
    }

    className += "text-white"

    return (
      <td className={className}>
        <Link
          to={`/registros?data=${dateStr}&projeto_id=${projetoId}`}
          className="hover:text-[#03A9F4] transition-colors block w-full"
        >
          {formatDuracao(duracao)}
        </Link>
      </td>
    )
  }

  const getFooterClass = (duracao: number) => {
    let className = "py-4 px-4 text-center font-mono text-sm font-bold border-x border-gray-800/30 "
    if (duracao === 0) {
      className += "text-gray-500"
    } else if (duracao > 0 && duracao < metaDiaria) {
      className += "text-red-400"
    } else {
      className += "text-emerald-400"
    }
    return className
  }

  const getFormatDate = (dow: number) => {
    const d = days.find(d => d.getDay() === dow)
    return d ? formatYYYYMMDD(d) : ''
  }

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">

        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Timesheet</h1>
            <p className="text-sm text-ink-500">Grade semanal para preenchimento de horas no sistema externo.</p>
          </div>
          <Button
            variante="secundario"
            tamanho="md"
            type="button"
            iconeEsquerda={<Copy className="h-4 w-4" />}
            className="min-h-[44px]"
            onClick={handleCopy}
            disabled={loading || tableData.length === 0}
          >
            Copiar Grade
          </Button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
            className="p-4 bg-bad-bg border rounded-card text-bad text-sm flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-bad" />
            <span className="font-ui">{error}</span>
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
          <div className="flex flex-col items-center justify-center gap-1 w-full md:w-auto md:flex-1">
            <div className="flex items-center justify-center gap-4">
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
            {/* Indicador no Mobile */}
            <div className="md:hidden text-center text-xs text-[#8B949E]">
              Meta: {formatMeta(metaSemanaExibida)}h/sem · {formatMeta(metaDiaria)}h/dia
            </div>
          </div>

          {/* Indicador no Desktop */}
          <div className="hidden md:block w-72 text-right text-xs text-[#8B949E]">
            Meta: {formatMeta(metaSemanaExibida)}h/sem · {formatMeta(metaDiaria)}h/dia
          </div>
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
            <div className="overflow-auto max-h-[62vh]">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="border-b-2 border-[#03A9F4]/30 bg-[#0B0E14]">
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[100px]">Código</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-full">Nome</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-20">Sáb</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-20">Dom</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Seg</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Ter</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Qua</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Qui</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-white uppercase tracking-wider text-center w-20">Sex</th>
                    <th className="sticky top-0 z-20 bg-[#0B0E14] py-4 px-4 text-xs font-bold text-[#03A9F4] uppercase tracking-wider text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {tableData.map((row) => (
                    <tr 
                      key={row.projetoId} 
                      className={`transition-colors group ${
                        selectedRow === row.projetoId
                          ? 'bg-[#03A9F4]/20'
                          : 'hover:bg-[#1E2530]/40'
                      }`}
                    >
                      <td 
                        className="py-3 px-4 font-mono text-sm text-gray-300 cursor-pointer select-none"
                        onClick={() => toggleRow(row.projetoId)}
                      >
                        {row.codigo}
                      </td>
                      <td 
                        className="py-3 px-4 font-semibold text-white truncate max-w-[200px] cursor-pointer select-none" 
                        title={row.nome}
                        onClick={() => toggleRow(row.projetoId)}
                      >
                        {row.nome}
                      </td>
                      {renderCell(row.sab, getFormatDate(6), row.projetoId)}
                      {renderCell(row.dom, getFormatDate(0), row.projetoId)}
                      {renderCell(row.seg, getFormatDate(1), row.projetoId)}
                      {renderCell(row.ter, getFormatDate(2), row.projetoId)}
                      {renderCell(row.qua, getFormatDate(3), row.projetoId)}
                      {renderCell(row.qui, getFormatDate(4), row.projetoId)}
                      {renderCell(row.sex, getFormatDate(5), row.projetoId)}
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
