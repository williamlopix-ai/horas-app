import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Sidebar from '../components/Sidebar'
import BreakdownSubcategorias from '../components/BreakdownSubcategorias'
import ModalRegistro from '../components/ModalRegistro'
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

  // Estados da seção Lançamentos / Modal de Registro
  const [isModalRegistroOpen, setIsModalRegistroOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<RegistroComDetalhes | null>(null)
  const [semanasExpandidas, setSemanasExpandidas] = useState<Record<string, boolean>>({})

  const carregarDados = async () => {
    if (!user || !id) return
    try {
      setLoading(true)
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
      setLoading(false)
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
      await carregarDados()
      fecharModalRegistro()
      showToast('Registro salvo!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao salvar registro:', err)
      showToast(getErrorMessage(err), 'error')
    }
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
              <h2 className="text-xl font-bold text-white">Fases & Subcategorias</h2>
              {fases.length > 0 ? (
                <div className="space-y-4">
                  {fases.map((fase) => {
                    const subsDaFase = subcategorias.filter(s => s.fase_id === fase.id)
                    const setSubIds = new Set(subsDaFase.map(s => s.id))
                    const regsDaFase = registros.filter(r => r.subcategoria_id && setSubIds.has(r.subcategoria_id))
                    const usadoFase = regsDaFase.reduce((acc, r) => acc + r.duracao, 0)
                    const isExpanded = fasesExpandidas[fase.id] ?? false
                    const subsMapeadas = subsDaFase.map(sub => {
                      const duracao = regsDaFase.filter(r => r.subcategoria_id === sub.id).reduce((acc, r) => acc + r.duracao, 0)
                      return { id: sub.id, nome: sub.nome, duracao, horas_alocadas: sub.horas_alocadas ?? null }
                    })
                    const comDuracao = subsMapeadas.filter(s => s.duracao > 0).sort((a, b) => b.duracao - a.duracao)
                    const semDuracao = subsMapeadas.filter(s => s.duracao === 0).sort((a, b) => a.nome.localeCompare(b.nome))
                    const subcategoriasComPercentual = [...comDuracao, ...semDuracao].map(s => ({ ...s, percentual: usadoFase > 0 ? Math.round((s.duracao / usadoFase) * 100) : 0 }))
                    const horasContratadasFormatadas = fase.horas_contratadas !== null && fase.horas_contratadas > 0 ? `${fase.horas_contratadas.toFixed(2).replace('.', ',')}h` : '—'
                    return (
                      <div key={fase.id} className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                        <button type="button" onClick={() => toggleFase(fase.id)} className="w-full flex items-center justify-between p-5 hover:bg-[#1E2530]/40 transition-colors focus:outline-none">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="font-bold text-white text-base truncate">{fase.nome}</span>
                          </div>
                          <div className="font-mono text-sm font-semibold text-[#8B949E]">
                            <span className="text-white font-bold">{usadoFase.toFixed(2).replace('.', ',')}h</span> / {horasContratadasFormatadas}
                          </div>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0'}`}>
                          <BreakdownSubcategorias subcategorias={subcategoriasComPercentual} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <h2 className="text-xl font-bold text-white">Lançamentos</h2>
                <p className="text-xs text-[#8B949E] mt-1">Clique em um lançamento para editar</p>
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
          </div>
        )}
      </main>
    </div>
  )
}
