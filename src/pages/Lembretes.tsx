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
import { Button } from '../components/ui'

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
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 lg:ml-[240px] max-w-5xl space-y-6 w-full overflow-y-auto">
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-900 tracking-tight">Lembretes</h2>
            <p className="text-sm text-ink-700">Organize e acompanhe seus lembretes e tarefas pendentes.</p>
          </div>
          <Button
            variante="primario"
            className="min-h-[44px]"
            onClick={abrirNovoLembreteModal}
            iconeEsquerda={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Novo Lembrete
          </Button>
        </div>

        {/* Exibição de Erro */}
        {error && (
          <div className="p-4 bg-bad-bg border border-bad rounded-xl text-bad text-sm flex items-center gap-3">
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
            <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2 border-b border-hair pb-2">
              <span>Pendentes</span>
              <span className="text-xs bg-surface-3 text-ink-700 px-2 py-0.5 rounded-full font-medium">
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
              <div className="bg-surface-2 border border-hair rounded-card p-12 text-center max-w-md mx-auto space-y-4">
                <div className="inline-flex p-4 rounded-full bg-surface-3 text-ink-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink-900">Nenhum lembrete pendente</h3>
                <p className="text-sm text-ink-700">
                  Tudo em dia! Você não tem nenhum lembrete pendente no momento.
                </p>
                <Button
                  variante="secundario"
                  className="min-h-[44px]"
                  onClick={abrirNovoLembreteModal}
                >
                  Criar Lembrete
                </Button>
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
                      className={`bg-surface-2 border rounded-card p-5 shadow-e1 transition-all flex flex-col justify-between min-h-[160px] ${
                        isVencido
                          ? 'border-l-4 border-l-bad border-hair'
                          : isHoje
                          ? 'border-l-4 border-l-accent border-hair'
                          : 'border-hair'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Tags e Data */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-mono text-ink-700">
                            {formatarData(lembrete.data_alvo)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isVencido && (
                              <span className="inline-flex items-center py-0.5 px-2 rounded-full text-[10px] font-bold bg-bad-bg text-bad border border-bad">
                                Vencido
                              </span>
                            )}
                            {isHoje && (
                              <span className="inline-flex items-center py-0.5 px-2 rounded-full text-[10px] font-bold bg-accent-bg text-accent border border-accent">
                                Hoje
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Título */}
                        <h4 className="text-base font-bold text-ink-900 tracking-tight break-words line-clamp-2">
                          {lembrete.titulo}
                        </h4>

                        {/* Descrição */}
                        {lembrete.descricao && (
                          <p className="text-xs text-ink-700 line-clamp-3 break-words whitespace-pre-line">
                            {lembrete.descricao}
                          </p>
                        )}
                      </div>

                      {/* Footer do Card */}
                      <div className="mt-4 pt-3 border-t border-hair flex items-center justify-between gap-3">
                        {/* Projeto Vinculado */}
                        <div className="min-w-0 flex-1">
                          {proj ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="h-2 w-2 rounded-full shrink-0 border border-black/10 shadow-sm"
                                style={{ backgroundColor: proj.cor }}
                              />
                              <span className="text-[11px] font-semibold text-ink-700 truncate" title={proj.nome}>
                                {proj.nome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-ink-300 font-medium italic">Sem projeto</span>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleAlternarStatus(lembrete)}
                            className="p-1.5 text-ink-700 hover:text-ok hover:bg-ok-bg rounded-lg transition-all focus:outline-none"
                            title="Concluir"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => abrirEditarLembreteModal(lembrete)}
                            className="p-1.5 text-ink-700 hover:text-accent hover:bg-accent-bg rounded-lg transition-all focus:outline-none"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setLembreteParaExcluir(lembrete)}
                            className="p-1.5 text-ink-700 hover:text-bad hover:bg-bad-bg rounded-lg transition-all focus:outline-none"
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
            <div className="border-t border-hair pt-6">
              <button
                onClick={() => setMostrarResolvidos(!mostrarResolvidos)}
                className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition-colors mb-4 focus:outline-none"
              >
                <span className="text-xs">{mostrarResolvidos ? '▼' : '▶'}</span>
                <h3 className="text-lg font-bold">Resolvidos ({resolvidos.length})</h3>
              </button>

              {mostrarResolvidos && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resolvidos.map((lembrete) => {
                    const proj = getProjetoInfo(lembrete.projeto_id)

                    return (
                      <div
                        key={lembrete.id}
                        className="bg-surface-2 border border-hair rounded-card p-5 shadow-e1 opacity-50 [@media(hover:hover)]:hover:opacity-80 transition-all flex flex-col justify-between min-h-[160px]"
                      >
                        <div className="space-y-2">
                          {/* Tags e Data */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-mono text-ink-500 line-through">
                              {formatarData(lembrete.data_alvo)}
                            </span>
                            <span className="inline-flex items-center py-0.5 px-2 rounded-full text-[10px] font-semibold bg-ok-bg text-ok border border-ok">
                              Resolvido
                            </span>
                          </div>

                          {/* Título */}
                          <h4 className="text-base font-bold text-ink-700 tracking-tight break-words line-clamp-2 line-through">
                            {lembrete.titulo}
                          </h4>

                          {/* Descrição */}
                          {lembrete.descricao && (
                            <p className="text-xs text-ink-500 line-clamp-3 break-words whitespace-pre-line line-through">
                              {lembrete.descricao}
                            </p>
                          )}
                        </div>

                        {/* Footer do Card */}
                        <div className="mt-4 pt-3 border-t border-hair flex items-center justify-between gap-3">
                          {/* Projeto Vinculado */}
                          <div className="min-w-0 flex-1">
                            {proj ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0 border border-black/10 shadow-sm opacity-50"
                                  style={{ backgroundColor: proj.cor }}
                                />
                                <span className="text-[11px] font-semibold text-ink-500 truncate" title={proj.nome}>
                                  {proj.nome}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-ink-300 font-medium italic">Sem projeto</span>
                            )}
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleAlternarStatus(lembrete)}
                              className="p-1.5 text-ink-700 hover:text-accent hover:bg-accent-bg rounded-lg transition-all focus:outline-none"
                              title="Reabrir (Mudar para Pendente)"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.706 8h-2.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setLembreteParaExcluir(lembrete)}
                              className="p-1.5 text-ink-700 hover:text-bad hover:bg-bad-bg rounded-lg transition-all focus:outline-none"
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
