import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { listarRegistros } from '../services/registros'
import { listarProjetos, arquivarProjeto, desarquivarProjeto, excluirPermanentemente } from '../services/projetos'
import { buscarConfiguracoes } from '../services/configuracoes'
import { buscarHorasBaseSemanal } from '../services/horas_base'
import { subcategoriasService } from '../services/subcategorias'
import { getErrorMessage } from '../utils/errors'
import type { Registro, Projeto, Subcategoria } from '../types'
import { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../contexts/ToastContext'

type Aba = 'semanal' | 'diario' | 'projetos'

function getSemanaInicioParaData(dataStr: string): string {
  const [year, month, day] = dataStr.split('-').map(Number)
  const data = new Date(year, month - 1, day)
  const diaSemana = data.getDay()
  const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  data.setDate(data.getDate() - diasAteSegunda)
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function BreakdownSubcategorias({ subcategorias }: { subcategorias: any[] }) {
  if (!subcategorias || subcategorias.length === 0) return null

  const temAlgumaAlocacao = subcategorias.some(
    sub => sub.id !== null && sub.horas_alocadas !== null && sub.horas_alocadas > 0
  )

  const somaSemAlocacao = subcategorias.reduce((acc, sub) => {
    const temAloc = sub.id !== null && sub.horas_alocadas !== null && sub.horas_alocadas > 0
    if (!temAloc) {
      return acc + sub.duracao
    }
    return acc
  }, 0)

  const exibirRodape = temAlgumaAlocacao && somaSemAlocacao > 0

  return (
    <div className="bg-[#1E2530]/50 rounded-xl p-4 border border-gray-800/60">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Subcategorias</span>
      <div className="space-y-2.5">
        {subcategorias.map((sub: any) => {
          const temAlocacao = sub.id !== null && sub.horas_alocadas !== null && sub.horas_alocadas > 0
          const excedeu = temAlocacao && sub.duracao > sub.horas_alocadas
          const percentualAlocado = temAlocacao ? Math.round((sub.duracao / sub.horas_alocadas) * 100) : 0
          const larguraBarra = temAlocacao ? Math.min(100, Math.max(0, (sub.duracao / sub.horas_alocadas) * 100)) : 0

          const duracaoFormatada = `${sub.duracao.toFixed(2).replace('.', ',')}h`
          const alocadoFormatado = temAlocacao
            ? (Number.isInteger(sub.horas_alocadas)
                ? `${sub.horas_alocadas}h`
                : `${sub.horas_alocadas.toString().replace('.', ',')}h`)
            : ''

          return (
            <div key={sub.id || 'sem_sub'} className="space-y-1 py-0.5">
              <div className="flex justify-between items-center text-xs gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.id === null ? 'border border-gray-500 bg-transparent' : 'bg-[#03A9F4]'}`} />
                  <span className="text-gray-300 whitespace-normal break-words" title={sub.nome}>{sub.nome}</span>
                  {temAlgumaAlocacao && !temAlocacao && sub.id !== null && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0B0E14] border border-gray-700 text-[#8B949E] shrink-0 font-medium">
                      sem alocação
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className="font-mono font-semibold text-white text-right">
                    {temAlocacao ? `${duracaoFormatada} / ${alocadoFormatado}` : duracaoFormatada}
                  </span>
                  {!temAlocacao && (
                    <span className="font-mono w-10 text-right font-medium text-[#6B7280]">
                      {sub.percentual}%
                    </span>
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

export default function Resumo() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [registros, setRegistros] = useState<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; status: 'ativo' | 'encerrado' | 'excluido'; nome_original: string | null } | null })[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [subcategoriasCadastradas, setSubcategoriasCadastradas] = useState<Subcategoria[]>([])
  const [metaSemanal, setMetaSemanal] = useState<number>(42.5)
  const [horasBasePorSemana, setHorasBasePorSemana] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [abaAtiva, setAbaAtiva] = useState<Aba>('semanal')
  const [rotinasExpandidas, setRotinasExpandidas] = useState<{ [key: string]: boolean }>({})
  const [projetosExpandidos, setProjetosExpandidos] = useState<{ [key: string]: boolean }>({})
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [apenasBillable, setApenasBillable] = useState(true)
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

      const [config, projs, regs, subs] = await Promise.all([
        buscarConfiguracoes(user.id),
        listarProjetos(user.id),
        listarRegistros(user.id),
        subcategoriasService.listarTodasSubcategorias(user.id)
      ])

      setMetaSemanal(config.meta_semanal)
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
    const segunda = new Date(y, m - 1, d)
    const domingo = new Date(segunda)
    domingo.setDate(segunda.getDate() + 6)

    const d1 = segunda.getDate()
    const m1 = meses[segunda.getMonth()]
    const d2 = domingo.getDate()
    const m2 = meses[domingo.getMonth()]
    const ano = domingo.getFullYear()

    if (segunda.getMonth() === domingo.getMonth()) {
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

  // 1. Semanal
  const resumoSemanas = useMemo(() => {
    const grupos: { [key: string]: number } = {}
    registros.forEach((reg) => {
      if (!reg.semana_inicio) return
      grupos[reg.semana_inicio] = (grupos[reg.semana_inicio] || 0) + reg.duracao
    })
    return Object.keys(grupos)
      .sort((a, b) => a.localeCompare(b))
      .map((semana) => {
        const totalHoras = grupos[semana]
        const baseVigente = horasBasePorSemana[semana] ?? metaSemanal
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
  }, [registros, metaSemanal, horasBasePorSemana])

  // 2. Diário
  const resumoDias = useMemo(() => {
    const grupos: { [key: string]: number } = {}
    registros.forEach((reg) => {
      grupos[reg.data] = (grupos[reg.data] || 0) + reg.duracao
    })
    return Object.keys(grupos)
      .sort((a, b) => a.localeCompare(b))
      .map((data) => {
        const totalHoras = grupos[data]
        const semanaDodia = getSemanaInicioParaData(data)
        const baseVigente = horasBasePorSemana[semanaDodia] ?? metaSemanal
        const metaDiariaVigente = baseVigente / 5
        const atingiuMeta = totalHoras >= metaDiariaVigente
        const percentual = Math.min(100, Math.round((totalHoras / metaDiariaVigente) * 100))
        const diferenca = totalHoras - metaDiariaVigente
        return { data, titulo: formatarTituloData(data), totalHoras, atingiuMeta, percentual, diferenca, metaDiariaVigente }
      })
  }, [registros, metaSemanal, horasBasePorSemana])

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

      const item = { id, nome, cor, totalHoras, qtd, horas_contratadas, registros: regs, subcategorias, status, arquivado, nome_original, billable }
      
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

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col lg:flex-row">
      
      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Painel de Resumos</h1>
          <p className="text-sm text-gray-400">Analise suas horas lançadas sob diferentes perspectivas.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Sistema de Abas e Toggle de Visualização */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex p-0.5 sm:p-1 bg-[#161B22] border border-gray-800 rounded-xl w-fit">
            <button
              onClick={() => setAbaAtiva('semanal')}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus:outline-none ${
                abaAtiva === 'semanal' ? 'bg-[#03A9F4] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setAbaAtiva('diario')}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus:outline-none ${
                abaAtiva === 'diario' ? 'bg-[#03A9F4] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setAbaAtiva('projetos')}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus:outline-none ${
                abaAtiva === 'projetos' ? 'bg-[#03A9F4] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Por Projetos
            </button>
          </div>

          {(abaAtiva === 'semanal' || abaAtiva === 'diario') && (
            <div className="flex bg-[#161B22] p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => changeViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-[#03A9F4] text-white shadow-sm shadow-[#03A9F4]/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Cards"
              >
                <span>⊞</span>
                <span>Cards</span>
              </button>
              <button
                onClick={() => changeViewMode('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'lista'
                    ? 'bg-[#03A9F4] text-white shadow-sm shadow-[#03A9F4]/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Lista</span>
              </button>
              <button
                onClick={() => changeViewMode('tabela')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'tabela'
                    ? 'bg-[#03A9F4] text-white shadow-sm shadow-[#03A9F4]/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Tabela"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Tabela</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : registros.length === 0 ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum histórico encontrado</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Você ainda não registrou nenhuma hora. Seus dados consolidados aparecerão aqui assim que fizer seus primeiros lançamentos.
            </p>
            <Link
              to="/registros"
              className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Ir para Lançamentos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* =========================================================================
                ABA: SEMANAL 
               ========================================================================= */}
            {abaAtiva === 'semanal' && (
              <div className="animate-in fade-in duration-300">
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resumoSemanas.map((semana) => {
                      const valorDiferenca = semana.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`

                      return (
                        <div key={semana.semana_inicio} className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-sm hover:border-gray-700/80 transition-all flex flex-col justify-between">
                          {/* Cabeçalho */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Período</span>
                              <h3 className="text-base font-bold text-white leading-snug">{semana.titulo}</h3>
                            </div>
                            <div className="shrink-0">
                              {semana.atingiuMeta ? (
                                <span className="inline-flex items-center justify-center p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Meta atingida">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center p-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20" title="Meta não atingida">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dados */}
                          <div className="grid grid-cols-3 gap-4 py-2 border-y border-gray-800/60">
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Trabalhado</span>
                              <span className="text-lg font-mono font-bold text-white">{semana.totalHoras.toFixed(2).replace('.', ',')}h</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Meta</span>
                              <span className="text-lg font-mono font-bold text-gray-400">{semana.metaVigente.toFixed(2).replace('.', ',')}h</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Restante</span>
                              <span className="text-lg font-mono font-bold" style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}>{diferencaTexto}</span>
                            </div>
                          </div>

                          {/* Progresso */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-gray-400">Progresso</span>
                              <span style={{ color: semana.atingiuMeta ? '#4CAF50' : '#F44336' }}>{semana.percentual}% Concluído</span>
                            </div>
                            <div className="w-full bg-[#0B0E14] h-3 rounded-full overflow-hidden border border-gray-800/50">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${semana.percentual}%`, backgroundColor: semana.atingiuMeta ? '#4CAF50' : '#F44336' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {viewMode === 'lista' && (
                  <div className="flex flex-col gap-2 bg-[#161B22] border border-gray-800 rounded-2xl p-4 divide-y divide-gray-800/60">
                    {resumoSemanas.map((semana) => {
                      const valorDiferenca = semana.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                      return (
                        <div key={semana.semana_inicio} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 first:pt-0 last:pb-0 gap-3 text-sm">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${semana.atingiuMeta ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-white truncate">{semana.titulo}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-400">
                            <div>Trabalhado: <span className="font-mono font-bold text-white">{semana.totalHoras.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Meta: <span className="font-mono text-gray-300">{semana.metaVigente.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Diferença: <span className="font-mono font-bold" style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}>{diferencaTexto}</span></div>
                            <div>Concluído: <span className="font-mono font-bold" style={{ color: semana.atingiuMeta ? '#4CAF50' : '#F44336' }}>{semana.percentual}%</span></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {viewMode === 'tabela' && (
                  <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 bg-[#1E2530]/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3.5 px-6">Período</th>
                            <th className="py-3.5 px-6 text-right">Trabalhado</th>
                            <th className="py-3.5 px-6 text-right">Meta</th>
                            <th className="py-3.5 px-6 text-right">Diferença</th>
                            <th className="py-3.5 px-6 text-right">%</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 text-sm">
                          {resumoSemanas.map((semana) => {
                            const valorDiferenca = semana.diferenca
                            const isPositivoOuZero = valorDiferenca >= 0
                            const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                            return (
                              <tr key={semana.semana_inicio} className="hover:bg-[#1E2530]/20 transition-colors">
                                <td className="py-4 px-6 font-semibold text-white">{semana.titulo}</td>
                                <td className="py-4 px-6 text-right font-mono font-semibold text-white">{semana.totalHoras.toFixed(2).replace('.', ',')}h</td>
                                <td className="py-4 px-6 text-right font-mono text-gray-400">{semana.metaVigente.toFixed(2).replace('.', ',')}h</td>
                                <td className="py-4 px-6 text-right font-mono font-bold" style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}>{diferencaTexto}</td>
                                <td className="py-4 px-6 text-right font-mono font-bold" style={{ color: semana.atingiuMeta ? '#4CAF50' : '#F44336' }}>{semana.percentual}%</td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold border ${
                                    semana.atingiuMeta 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${semana.atingiuMeta ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    {semana.atingiuMeta ? 'Atingida' : 'Pendente'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                ABA: DIÁRIO
               ========================================================================= */}
            {abaAtiva === 'diario' && (
              <div className="animate-in fade-in duration-300">
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {resumoDias.map((dia) => {
                      const valorDiferenca = dia.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`

                      return (
                        <div key={dia.data} className="bg-[#161B22] border border-gray-800 rounded-xl p-5 space-y-4 shadow-sm hover:border-gray-700/80 transition-all flex flex-col justify-between">
                          {/* Cabeçalho */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-sm font-bold text-white capitalize leading-snug">{dia.titulo}</h3>
                            </div>
                            <div className="shrink-0">
                              {dia.atingiuMeta ? (
                                <span className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-400" title="Meta atingida">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </span>
                              ) : (
                                <span className="inline-flex p-1 rounded-full bg-red-500/10 text-red-400" title="Meta não atingida">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dados */}
                          <div className="flex justify-between py-2 border-y border-gray-800/60">
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Trabalhado</span>
                              <span className="text-base font-mono font-bold text-white">{dia.totalHoras.toFixed(2).replace('.', ',')}h</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Diferença</span>
                              <span className="text-base font-mono font-bold" style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}>{diferencaTexto}</span>
                            </div>
                          </div>

                          {/* Progresso */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-semibold">
                              <span className="text-gray-400">Meta: {dia.metaDiariaVigente.toFixed(2).replace('.', ',')}h</span>
                              <span style={{ color: dia.atingiuMeta ? '#4CAF50' : '#F44336' }}>{dia.percentual}%</span>
                            </div>
                            <div className="w-full bg-[#0B0E14] h-2 rounded-full overflow-hidden border border-gray-800/50">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dia.percentual}%`, backgroundColor: dia.atingiuMeta ? '#4CAF50' : '#F44336' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {viewMode === 'lista' && (
                  <div className="flex flex-col gap-2 bg-[#161B22] border border-gray-800 rounded-2xl p-4 divide-y divide-gray-800/60">
                    {resumoDias.map((dia) => {
                      const valorDiferenca = dia.diferenca
                      const isPositivoOuZero = valorDiferenca >= 0
                      const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                      return (
                        <div key={dia.data} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 first:pt-0 last:pb-0 gap-3 text-sm">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dia.atingiuMeta ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-white capitalize truncate">{dia.titulo}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-400">
                            <div>Trabalhado: <span className="font-mono font-bold text-white">{dia.totalHoras.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Meta: <span className="font-mono text-gray-300">{dia.metaDiariaVigente.toFixed(2).replace('.', ',')}h</span></div>
                            <div>Diferença: <span className="font-mono font-bold" style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}>{diferencaTexto}</span></div>
                            <div>Concluído: <span className="font-mono font-bold" style={{ color: dia.atingiuMeta ? '#4CAF50' : '#F44336' }}>{dia.percentual}%</span></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {viewMode === 'tabela' && (
                  <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 bg-[#1E2530]/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3.5 px-6">Dia</th>
                            <th className="py-3.5 px-6 text-right">Trabalhado</th>
                            <th className="py-3.5 px-6 text-right">Meta</th>
                            <th className="py-3.5 px-6 text-right">Diferença</th>
                            <th className="py-3.5 px-6 text-right">%</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 text-sm">
                          {resumoDias.map((dia) => {
                            const valorDiferenca = dia.diferenca
                            const isPositivoOuZero = valorDiferenca >= 0
                            const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`
                            return (
                              <tr key={dia.data} className="hover:bg-[#1E2530]/20 transition-colors">
                                <td className="py-4 px-6 font-semibold text-white capitalize">{dia.titulo}</td>
                                <td className="py-4 px-6 text-right font-mono font-semibold text-white">{dia.totalHoras.toFixed(2).replace('.', ',')}h</td>
                                <td className="py-4 px-6 text-right font-mono text-gray-400">{dia.metaDiariaVigente.toFixed(2).replace('.', ',')}h</td>
                                <td className="py-4 px-6 text-right font-mono font-bold" style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}>{diferencaTexto}</td>
                                <td className="py-4 px-6 text-right font-mono font-bold" style={{ color: dia.atingiuMeta ? '#4CAF50' : '#F44336' }}>{dia.percentual}%</td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold border ${
                                    dia.atingiuMeta 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${dia.atingiuMeta ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    {dia.atingiuMeta ? 'Atingida' : 'Pendente'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                ABA: PROJETOS 
               ========================================================================= */}
            {abaAtiva === 'projetos' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setApenasBillable(v => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    <span
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        apenasBillable ? 'bg-[#03A9F4]' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          apenasBillable ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    Apenas billable
                  </button>
                </div>
                {/* Seção Projetos */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Projetos</h2>
                  {projetosVisiveis.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-[#161B22] p-4 rounded-xl border border-gray-800">Nenhum projeto registrado.</div>
                  ) : (
                    <div className="space-y-10">
                      {/* Ativos */}
                      {projetosVisiveis.filter(p => p.status === 'ativo' && !p.arquivado).length > 0 && (
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projetosVisiveis.filter(p => p.status === 'ativo' && !p.arquivado).map(proj => {
                              const temContrato = proj.horas_contratadas !== null && proj.horas_contratadas > 0;
                              const percentual = temContrato ? Math.min(100, Math.round((proj.totalHoras / proj.horas_contratadas) * 100)) : 0;
                              const passou = temContrato && proj.totalHoras > proj.horas_contratadas;
                              const diff = temContrato ? Math.abs(proj.horas_contratadas - proj.totalHoras) : 0;
                              const isExpanded = projetosExpandidos[proj.id] || false;
                              const hasDetalhamento = proj.registros.length > 0 || proj.subcategorias.length > 0;

                              return (
                                <div key={proj.id} className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-sm hover:border-gray-700/80 transition-all flex flex-col space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: proj.cor }}>
                                        <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                                      </span>
                                      <span className="font-bold text-white uppercase text-base truncate" title={proj.nome}>{proj.nome}</span>
                                    </div>
                                  </div>
                                  <hr className="border-gray-800/80" />
                                  <div className="flex-1 space-y-3">
                                    {temContrato ? (
                                      <p className="text-sm font-medium text-[#8B949E]">
                                        <span className="text-white font-bold">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas de {proj.horas_contratadas.toFixed(2).replace('.', ',')}h contratadas
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium text-[#8B949E]">
                                        <span className="text-white font-bold">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas
                                      </p>
                                    )}
                                    {temContrato && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 bg-[#0B0E14] h-[6px] rounded-full overflow-hidden border border-gray-800/50">
                                            <div className="h-full transition-all duration-500" style={{ width: `${percentual}%`, backgroundColor: passou ? '#F44336' : '#4CAF50' }} />
                                          </div>
                                          <span className="text-sm font-bold" style={{ color: passou ? '#F44336' : '#4CAF50' }}>{percentual}%</span>
                                        </div>
                                        {passou ? (
                                          <p className="text-sm font-bold text-red-500">{diff.toFixed(2).replace('.', ',')}h acima do contrato</p>
                                        ) : (
                                          <p className="text-sm font-bold text-emerald-500">{diff.toFixed(2).replace('.', ',')}h restantes</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {hasDetalhamento && (
                                    <div className="pt-2">
                                      <button onClick={() => toggleProjeto(proj.id)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-white transition-colors py-2 focus:outline-none">
                                        <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                      </button>
                                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[32rem] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                        <BreakdownSubcategorias subcategorias={proj.subcategorias} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inativos */}
                      {projetosVisiveis.filter(p => p.status !== 'ativo' && !p.arquivado).length > 0 && (
                        <div>
                          <h2 className="text-lg font-bold text-gray-400 mb-4">Encerrados / Excluídos</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projetosVisiveis.filter(p => p.status !== 'ativo' && !p.arquivado).map(proj => {
                              const temContrato = proj.horas_contratadas !== null && proj.horas_contratadas > 0;
                              const isExpanded = projetosExpandidos[proj.id] || false;
                              const hasDetalhamento = proj.registros.length > 0 || proj.subcategorias.length > 0;
                              
                              const isExcluido = proj.status === 'excluido';
                              const projNome = isExcluido ? (proj.nome_original || 'Sem Projeto') : (proj.nome || 'Sem Projeto');
                              const projCor = isExcluido ? '#4B5563' : '#6B7280';

                              return (
                                <div key={proj.id} className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-sm hover:border-gray-700/80 transition-all flex flex-col space-y-4 opacity-60 hover:opacity-80">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: projCor }}>
                                        <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                                      </span>
                                      <span className={`font-bold text-white uppercase text-base truncate ${isExcluido ? 'italic' : ''}`} title={projNome}>{projNome}</span>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                      {isExcluido ? 'Excluído' : 'Encerrado'}
                                    </span>
                                  </div>
                                  <hr className="border-gray-800/80" />
                                  <div className="flex-1 space-y-3">
                                    {temContrato ? (
                                      <p className="text-sm font-medium text-[#8B949E]">
                                        <span className="text-white font-bold">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas de {proj.horas_contratadas.toFixed(2).replace('.', ',')}h contratadas
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium text-[#8B949E]">
                                        <span className="text-white font-bold">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas
                                      </p>
                                    )}
                                  </div>
                                  {hasDetalhamento && (
                                    <div className="pt-2">
                                      <button onClick={() => toggleProjeto(proj.id)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-white transition-colors py-2 focus:outline-none">
                                        <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                      </button>
                                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[32rem] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                        <BreakdownSubcategorias subcategorias={proj.subcategorias} />
                                      </div>
                                    </div>
                                  )}
                                  <div className="pt-3 border-t border-gray-800/80 mt-auto">
                                    <button onClick={() => handleArquivar(proj.id)} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-all border border-gray-700/50">
                                      Arquivar Projeto
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Arquivados */}
                      {projetosVisiveis.filter(p => p.arquivado).length > 0 && (
                        <div className="border-t border-gray-800/80 pt-6">
                          <button 
                            onClick={() => setMostrarArquivados(!mostrarArquivados)}
                            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4 focus:outline-none"
                          >
                            <span className="text-xs">{mostrarArquivados ? '▼' : '▶'}</span>
                            <h2 className="text-lg font-bold">Arquivados ({projetosVisiveis.filter(p => p.arquivado).length})</h2>
                          </button>
                          
                          {mostrarArquivados && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {projetosVisiveis.filter(p => p.arquivado).map(proj => {
                                const temContrato = proj.horas_contratadas !== null && proj.horas_contratadas > 0;
                                const isExpanded = projetosExpandidos[proj.id] || false;
                                const hasDetalhamento = proj.registros.length > 0 || proj.subcategorias.length > 0;
                                
                                const isExcluido = proj.status === 'excluido';
                                const isEncerrado = proj.status === 'encerrado';
                                const projNome = isExcluido ? (proj.nome_original || 'Sem Projeto') : (proj.nome || 'Sem Projeto');
                                const projCor = isExcluido ? '#4B5563' : isEncerrado ? '#6B7280' : proj.cor;

                                return (
                                  <div key={proj.id} className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-sm hover:border-gray-700/80 transition-all flex flex-col space-y-4 opacity-40 hover:opacity-60">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: projCor }}>
                                          <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                                        </span>
                                        <span className={`font-bold text-white uppercase text-base truncate ${isExcluido || isEncerrado ? 'italic' : ''}`} title={projNome}>{projNome}</span>
                                      </div>
                                    </div>
                                    <hr className="border-gray-800/80" />
                                    <div className="flex-1 space-y-3">
                                      {temContrato ? (
                                        <p className="text-sm font-medium text-[#8B949E]">
                                          <span className="text-white font-bold">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas de {proj.horas_contratadas.toFixed(2).replace('.', ',')}h contratadas
                                        </p>
                                      ) : (
                                        <p className="text-sm font-medium text-[#8B949E]">
                                          <span className="text-white font-bold">{proj.totalHoras.toFixed(2).replace('.', ',')}h</span> lançadas
                                        </p>
                                      )}
                                    </div>
                                    {hasDetalhamento && (
                                      <div className="pt-2">
                                        <button onClick={() => toggleProjeto(proj.id)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-white transition-colors py-2 focus:outline-none">
                                          <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[32rem] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                          <BreakdownSubcategorias subcategorias={proj.subcategorias} />
                                        </div>
                                      </div>
                                    )}
                                    <div className="pt-3 border-t border-gray-800/80 mt-auto flex flex-col gap-2">
                                      <button onClick={() => handleDesarquivar(proj.id)} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-all border border-gray-700/50">
                                        Desarquivar Projeto
                                      </button>
                                      {isExcluido && (
                                        <button onClick={() => setProjetoParaExcluir({ id: proj.id, nome: projNome })} className="w-full py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-all border border-red-500/20 hover:border-red-600">
                                          Excluir permanentemente
                                        </button>
                                      )}
                                    </div>
                                  </div>
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
                    <h2 className="text-xl font-bold text-white mb-4">Rotina</h2>
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-gray-800/60">
                        {resumoProjetos.rotinas.map((rotina) => {
                          const isExpanded = rotinasExpandidas[rotina.id] || false;
                          return (
                            <div key={rotina.id} className="flex flex-col border-b border-gray-800/60 last:border-0">
                              <div 
                                className="flex items-center justify-between p-4 hover:bg-[#1E2530] transition-colors cursor-pointer"
                                onClick={() => toggleRotina(rotina.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: rotina.cor }}></span>
                                  <p className="font-bold text-white text-sm uppercase tracking-wide truncate" title={rotina.nome}>{rotina.nome}</p>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                  <span className="font-mono font-bold text-[#03A9F4] text-base">{rotina.totalHoras.toFixed(2).replace('.', ',')}h</span>
                                  <span className="text-xs font-semibold text-gray-500 w-[70px]">{rotina.qtd} {rotina.qtd === 1 ? 'registro' : 'registros'}</span>
                                  <svg className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              
                              <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
                                <div className="flex flex-col gap-1 px-4 ml-[22px] border-l-2 border-gray-800/50 pl-3">
                                  {rotina.registros.map((reg: any) => (
                                    <div key={reg.id} className="flex items-center gap-3 py-1">
                                      <span className="text-xs text-gray-400 font-mono w-[50px] shrink-0">{formatarDataCurta(reg.data)}</span>
                                      <span className="text-gray-600">·</span>
                                      <span className="text-xs text-gray-400 font-mono w-[85px] shrink-0">{reg.hora_inicio.slice(0, 5)}-{reg.hora_fim.slice(0, 5)}</span>
                                      <span className="text-gray-600">·</span>
                                      <span className="text-xs text-gray-400 font-mono font-bold shrink-0">{reg.duracao.toFixed(2).replace('.', ',')}h</span>
                                      {reg.observacao && (
                                        <>
                                          <span className="text-gray-600">·</span>
                                          <span className="text-[11px] text-gray-500 italic truncate" title={reg.observacao}>{reg.observacao}</span>
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
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão Permanente */}
      {projetoParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-red-500">⚠</span> Atenção — Ação irreversível
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Todos os lançamentos vinculados a <strong className="text-white">{projetoParaExcluir.nome}</strong> serão excluídos permanentemente.
              <br/><br/>
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjetoParaExcluir(null)}
                className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white text-sm font-semibold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusaoPermanente}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
              >
                Excluir tudo permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
