import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Sidebar from '../components/Sidebar'
import {
  listarLembretes,
  criarLembrete,
  atualizarLembrete,
  excluirLembrete
} from '../services/lembretes'
import { listarProjetos } from '../services/projetos'
import { getErrorMessage } from '../utils/errors'
import type { Lembrete, Projeto } from '../types'
import ModalLembrete from '../components/ModalLembrete'
import { SkeletonCard } from '../components/Skeleton'
import ModalConfirmacao from '../components/ModalConfirmacao'

export default function Lembretes() {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lembreteEmEdicao, setLembreteEmEdicao] = useState<Lembrete | null>(null)
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false)
  const [lembreteParaExcluir, setLembreteParaExcluir] = useState<Lembrete | null>(null)

  const avisoMostrado = useRef(false)

  // Pegar data de hoje no formato local YYYY-MM-DD
  const getHojeStr = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const hoje = getHojeStr()

  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const [dadosLembretes, dadosProjetos] = await Promise.all([
        listarLembretes(user.id),
        listarProjetos(user.id, false)
      ])
      setLembretes(dadosLembretes)
      setProjetos(dadosProjetos)

      // Exibir aviso apenas uma vez na montagem inicial da tela
      if (!avisoMostrado.current) {
        const pendentesLembretes = dadosLembretes.filter(l => l.status === 'pendente')
        const qtdHoje = pendentesLembretes.filter(l => l.data_alvo === hoje).length
        const qtdVencidos = pendentesLembretes.filter(l => l.data_alvo < hoje).length

        if (qtdHoje > 0 || qtdVencidos > 0) {
          let msg = ''
          if (qtdHoje > 0 && qtdVencidos > 0) {
            msg = `Você tem ${qtdHoje} lembrete(s) para hoje e ${qtdVencidos} atrasado(s).`
          } else if (qtdHoje > 0) {
            msg = `Você tem ${qtdHoje} lembrete(s) para hoje.`
          } else {
            msg = `Você tem ${qtdVencidos} lembrete(s) atrasado(s).`
          }
          showToast(msg, 'info')
        }
        avisoMostrado.current = true
      }
    } catch (err: any) {
      console.error('Erro ao carregar lembretes:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user])

  const abrirNovoLembreteModal = () => {
    setLembreteEmEdicao(null)
    setIsModalOpen(true)
  }

  const abrirEditarLembreteModal = (lembrete: Lembrete) => {
    setLembreteEmEdicao(lembrete)
    setIsModalOpen(true)
  }

  const fecharModal = () => {
    setIsModalOpen(false)
    setLembreteEmEdicao(null)
  }

  const handleSalvarLembrete = async (dados: {
    titulo: string
    descricao: string | null
    data_alvo: string
    projeto_id: string | null
  }) => {
    if (!user) return

    try {
      if (lembreteEmEdicao) {
        await atualizarLembrete(lembreteEmEdicao.id, dados)
        showToast('Lembrete atualizado!', 'success')
      } else {
        await criarLembrete({
          usuario_id: user.id,
          ...dados
        })
        showToast('Lembrete criado!', 'success')
      }
      await carregarDados()
    } catch (err: any) {
      console.error('Erro ao salvar lembrete:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const confirmarExclusao = async () => {
    if (!lembreteParaExcluir) return
    try {
      await excluirLembrete(lembreteParaExcluir.id)
      showToast('Lembrete excluído!', 'success')
      await carregarDados()
    } catch (err: any) {
      console.error('Erro ao excluir lembrete:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLembreteParaExcluir(null)
    }
  }

  const handleAlternarStatus = async (lembrete: Lembrete) => {
    try {
      const novoStatus = lembrete.status === 'pendente' ? 'concluido' : 'pendente'
      await atualizarLembrete(lembrete.id, { status: novoStatus })
      showToast(
        novoStatus === 'concluido' ? 'Lembrete concluído!' : 'Lembrete reaberto!',
        'success'
      )
      await carregarDados()
    } catch (err: any) {
      console.error('Erro ao alternar status do lembrete:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  // Auxiliar para formatar data de YYYY-MM-DD para DD/MM/AAAA
  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '—'
    const partes = dataStr.split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return dataStr
  }

  // Filtrar e ordenar lembretes
  const pendentes = lembretes
    .filter(l => l.status === 'pendente')
    .sort((a, b) => a.data_alvo.localeCompare(b.data_alvo))

  const resolvidos = lembretes
    .filter(l => l.status === 'concluido')
    .sort((a, b) => b.data_alvo.localeCompare(a.data_alvo))

  const getProjetoInfo = (projetoId: string | null) => {
    if (!projetoId) return null
    return projetos.find(p => p.id === projetoId) || null
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 lg:ml-[240px] max-w-5xl space-y-6 w-full overflow-y-auto">
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Lembretes</h2>
            <p className="text-sm text-gray-400">Organize e acompanhe seus lembretes e tarefas pendentes.</p>
          </div>
          <button
            onClick={abrirNovoLembreteModal}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03A9F4]/20 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo Lembrete
          </button>
        </div>

        {/* Exibição de Erro */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Área Principal */}
        <div className="space-y-8">
          {/* Pendentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <span>Pendentes</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {loading ? '...' : pendentes.length}
              </span>
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : pendentes.length === 0 ? (
              <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Nenhum lembrete pendente</h3>
                <p className="text-sm text-gray-400">
                  Tudo em dia! Você não tem nenhum lembrete pendente no momento.
                </p>
                <button
                  onClick={abrirNovoLembreteModal}
                  className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  Criar Lembrete
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendentes.map((lembrete) => {
                  const proj = getProjetoInfo(lembrete.projeto_id)
                  const isHoje = lembrete.data_alvo === hoje
                  const isVencido = lembrete.data_alvo < hoje

                  return (
                    <div
                      key={lembrete.id}
                      className={`bg-[#161B22] border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[160px] animate-in fade-in zoom-in duration-200 ${
                        isVencido
                          ? 'border-l-4 border-l-[#F44336] border-gray-800'
                          : isHoje
                          ? 'border-l-4 border-l-[#03A9F4] border-gray-800'
                          : 'border-gray-800'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Tags e Data */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">
                            {formatarData(lembrete.data_alvo)}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {isVencido && (
                              <span className="inline-flex items-center py-0.5 px-2 rounded-full text-[10px] font-bold bg-[#F44336]/10 text-[#F44336] border border-[#F44336]/20">
                                Vencido
                              </span>
                            )}
                            {isHoje && (
                              <span className="inline-flex items-center py-0.5 px-2 rounded-full text-[10px] font-bold bg-[#03A9F4]/10 text-[#03A9F4] border border-[#03A9F4]/20">
                                Hoje
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Título */}
                        <h4 className="text-base font-bold text-white tracking-tight break-words line-clamp-2">
                          {lembrete.titulo}
                        </h4>

                        {/* Descrição */}
                        {lembrete.descricao && (
                          <p className="text-xs text-gray-400 line-clamp-3 break-words whitespace-pre-line">
                            {lembrete.descricao}
                          </p>
                        )}
                      </div>

                      {/* Footer do Card */}
                      <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between gap-3">
                        {/* Projeto Vinculado */}
                        <div className="min-w-0 flex-1">
                          {proj ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="h-2 w-2 rounded-full shrink-0 border border-black/10 shadow-sm"
                                style={{ backgroundColor: proj.cor }}
                              />
                              <span className="text-[11px] font-semibold text-gray-400 truncate" title={proj.nome}>
                                {proj.nome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-600 font-medium italic">Sem projeto</span>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleAlternarStatus(lembrete)}
                            className="p-1.5 text-gray-400 hover:text-[#4CAF50] hover:bg-[#4CAF50]/10 rounded-lg transition-all focus:outline-none"
                            title="Concluir"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => abrirEditarLembreteModal(lembrete)}
                            className="p-1.5 text-gray-400 hover:text-[#03A9F4] hover:bg-[#03A9F4]/10 rounded-lg transition-all focus:outline-none"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setLembreteParaExcluir(lembrete)}
                            className="p-1.5 text-gray-400 hover:text-[#F44336] hover:bg-[#F44336]/10 rounded-lg transition-all focus:outline-none"
                            title="Excluir"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Resolvidos (Recolhível) */}
          {resolvidos.length > 0 && (
            <div className="border-t border-gray-800/80 pt-6">
              <button
                onClick={() => setMostrarResolvidos(!mostrarResolvidos)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4 focus:outline-none"
              >
                <span className="text-xs">{mostrarResolvidos ? '▼' : '▶'}</span>
                <h3 className="text-lg font-bold">Resolvidos ({resolvidos.length})</h3>
              </button>

              {mostrarResolvidos && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {resolvidos.map((lembrete) => {
                    const proj = getProjetoInfo(lembrete.projeto_id)

                    return (
                      <div
                        key={lembrete.id}
                        className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-sm opacity-50 [@media(hover:hover)]:hover:opacity-80 transition-all flex flex-col justify-between min-h-[160px]"
                      >
                        <div className="space-y-2">
                          {/* Tags e Data */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-500 line-through">
                              {formatarData(lembrete.data_alvo)}
                            </span>
                            <span className="inline-flex items-center py-0.5 px-2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Resolvido
                            </span>
                          </div>

                          {/* Título */}
                          <h4 className="text-base font-bold text-gray-400 tracking-tight break-words line-clamp-2 line-through">
                            {lembrete.titulo}
                          </h4>

                          {/* Descrição */}
                          {lembrete.descricao && (
                            <p className="text-xs text-gray-500 line-clamp-3 break-words whitespace-pre-line line-through">
                              {lembrete.descricao}
                            </p>
                          )}
                        </div>

                        {/* Footer do Card */}
                        <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between gap-3">
                          {/* Projeto Vinculado */}
                          <div className="min-w-0 flex-1">
                            {proj ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0 border border-black/10 shadow-sm opacity-50"
                                  style={{ backgroundColor: proj.cor }}
                                />
                                <span className="text-[11px] font-semibold text-gray-500 truncate" title={proj.nome}>
                                  {proj.nome}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-medium italic">Sem projeto</span>
                            )}
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleAlternarStatus(lembrete)}
                              className="p-1.5 text-gray-400 hover:text-[#03A9F4] hover:bg-[#03A9F4]/10 rounded-lg transition-all focus:outline-none"
                              title="Reabrir (Mudar para Pendente)"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.706 8h-2.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setLembreteParaExcluir(lembrete)}
                              className="p-1.5 text-gray-400 hover:text-[#F44336] hover:bg-[#F44336]/10 rounded-lg transition-all focus:outline-none"
                              title="Excluir permanentemente"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ModalLembrete
        isOpen={isModalOpen}
        onClose={fecharModal}
        onSave={handleSalvarLembrete}
        lembrete={lembreteEmEdicao}
        projetos={projetos}
      />

      <ModalConfirmacao
        isOpen={lembreteParaExcluir !== null}
        titulo="Excluir lembrete"
        mensagem="Esta ação não pode ser desfeita. Deseja realmente excluir este lembrete?"
        textoConfirmar="Excluir"
        perigo
        onConfirmar={confirmarExclusao}
        onCancelar={() => setLembreteParaExcluir(null)}
      />
    </div>
  )
}
