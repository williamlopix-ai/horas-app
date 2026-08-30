import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import Sidebar from '../components/Sidebar'
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
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  listarProjetos,
  criarProjeto,
  atualizarProjeto,
  encerrarProjeto,
  reativarProjeto,
  excluirProjeto,
  excluirProjetoComRegistros,
  arquivarProjeto,
  atualizarOrdemProjetos
} from '../services/projetos'
import { fasesService } from '../services/fases'
import { supabase } from '../lib/supabase'
import { getErrorMessage } from '../utils/errors'
import type { Projeto } from '../types'
import ModalProjeto from '../components/ModalProjeto'
import MenuAcoes from '../components/MenuAcoes'
import { SkeletonRow } from '../components/Skeleton'
import { Button, Surface } from '../components/ui'

interface ProjetoRowItemProps {
  projeto: Projeto
  abaAtiva: 'projeto' | 'rotina'
  onEdit: (projeto: Projeto) => void
  onToggleStatus: (projeto: Projeto) => void
  onExcluir: (projeto: Projeto) => void
  onArquivar: (projeto: Projeto) => void
  onNavigate: (id: string) => void
}

function ProjetoRowItem({
  projeto,
  abaAtiva,
  onEdit,
  onToggleStatus,
  onExcluir,
  onArquivar,
  onNavigate
}: ProjetoRowItemProps) {
  const isDraggable = abaAtiva === 'projeto' && projeto.status === 'ativo'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: projeto.id,
    disabled: !isDraggable
  })

  const style = isDraggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? ('relative' as const) : undefined
      }
    : undefined

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-surface-2 transition-all group grid grid-cols-[1fr_auto] md:table-row p-3 md:p-0 gap-x-md gap-y-2xs md:gap-0 mb-2 md:mb-0 bg-surface-1 md:bg-transparent rounded-card md:rounded-none !border-t-0 ring-1 ring-hair-strong md:ring-0 ${
        isDragging ? 'shadow-e3 ring-2 ring-accent' : ''
      }`}
    >
      <td className="block md:table-cell py-1 md:py-4 px-0 md:px-6 self-center">
        <div className="flex items-center gap-md">
          {isDraggable && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="text-ink-300 hover:text-ink-700 cursor-grab active:cursor-grabbing min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors touch-none shrink-0"
              title="Arrastar para reordenar"
            >
              <svg className="w-icon-md h-icon-md" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
            </button>
          )}
          <span
            className="w-4 h-4 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: projeto.cor }}
          />
          <button
            type="button"
            onClick={() => onNavigate(projeto.id)}
            className="font-semibold text-ink-900 text-sm md:text-base break-words whitespace-normal overflow-hidden md:whitespace-nowrap md:text-ellipsis max-w-[200px] sm:max-w-xs md:max-w-none text-left bg-transparent border-none p-0 m-0 cursor-pointer hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg rounded-sm"
            title={projeto.nome}
          >
            {projeto.nome}
          </button>
        </div>
      </td>
      <td className="flex items-center justify-between md:table-cell py-1 md:py-4 px-0 md:px-6 self-center">
        <span
          className={`inline-flex items-center gap-xs py-1 px-2.5 rounded-full text-xs font-medium ${
            projeto.status === 'ativo'
              ? 'bg-ok-bg text-ok'
              : projeto.status === 'encerrado'
              ? 'bg-warn-bg text-warn'
              : 'bg-bad-bg text-bad'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {projeto.status === 'ativo'
            ? 'Ativo'
            : projeto.status === 'encerrado'
            ? 'Encerrado'
            : 'Excluído'}
        </span>
        {abaAtiva === 'projeto' && projeto.status !== 'excluido' && (
          <div className="md:hidden shrink-0">
            <MenuAcoes
              rotulo="Ações do projeto"
              itens={[
                {
                  label: 'Editar',
                  onClick: () => onEdit(projeto)
                },
                {
                  label: projeto.status === 'ativo' ? 'Encerrar' : 'Reativar',
                  onClick: () => onToggleStatus(projeto)
                },
                {
                  label: 'Excluir',
                  onClick: () => onExcluir(projeto),
                  perigo: true,
                  separadorAntes: true
                }
              ]}
            />
          </div>
        )}
      </td>
      <td className="col-span-2 block md:table-cell py-1 md:py-4 px-0 md:px-6 text-left md:text-right">
        <div className="flex flex-row flex-wrap md:inline-flex gap-sm w-full md:w-auto">
          {projeto.status === 'excluido' ? (
            <>
              <span className="inline-flex items-center justify-center py-1.5 px-3 bg-surface-2 text-ink-500 text-xs font-semibold rounded-ctl border border-hair w-auto text-center">
                Excluído
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onArquivar(projeto)
                }}
                className="py-1.5 px-3 bg-surface-2 hover:bg-surface-3 text-ink-700 hover:text-ink-900 text-xs font-semibold rounded-ctl transition-all border border-hair-strong w-auto text-center justify-center"
              >
                Arquivar
              </button>
            </>
          ) : (
            <div className="hidden md:flex gap-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(projeto)
                }}
                className="py-1.5 px-3 bg-surface-2 hover:bg-surface-3 text-ink-700 hover:text-ink-900 text-xs font-semibold rounded-ctl transition-all border border-hair-strong w-auto text-center justify-center"
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStatus(projeto)
                }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-ctl transition-all border w-auto text-center justify-center ${
                  projeto.status === 'ativo'
                    ? 'bg-warn-bg text-warn border-warn hover:opacity-80'
                    : 'bg-ok-bg text-ok border-ok hover:opacity-80'
                }`}
              >
                {projeto.status === 'ativo' ? 'Encerrar' : 'Reativar'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExcluir(projeto)
                }}
                className="py-1.5 px-3 bg-bad-bg text-bad text-xs font-semibold rounded-ctl transition-all border border-bad hover:opacity-80 w-auto text-center justify-center"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function Projetos() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<'projeto' | 'rotina'>('projeto')

  const projetosFiltrados = useMemo(() => {
    const filtrados = projetos.filter(p => (p.tipo || 'projeto') === abaAtiva && !p.arquivado)
    return filtrados.sort((a, b) => {
      const aAtivo = a.status === 'ativo' ? 0 : 1
      const bAtivo = b.status === 'ativo' ? 0 : 1
      if (aAtivo !== bAtivo) return aAtivo - bAtivo

      if (a.ordem !== null && a.ordem !== undefined && b.ordem !== null && b.ordem !== undefined) {
        if (a.ordem !== b.ordem) return a.ordem - b.ordem
        return a.nome.localeCompare(b.nome)
      }
      if ((a.ordem !== null && a.ordem !== undefined) && (b.ordem === null || b.ordem === undefined)) return -1
      if ((a.ordem === null || a.ordem === undefined) && (b.ordem !== null && b.ordem !== undefined)) return 1
      return a.nome.localeCompare(b.nome)
    })
  }, [projetos, abaAtiva])

  const projetosAtivos = useMemo(() => {
    if (abaAtiva !== 'projeto') return []
    return projetosFiltrados.filter(p => p.status === 'ativo')
  }, [projetosFiltrados, abaAtiva])

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

    const oldIndex = projetosAtivos.findIndex(p => p.id === active.id)
    const newIndex = projetosAtivos.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedAtivos = arrayMove(projetosAtivos, oldIndex, newIndex)
    const atualizacoesOrdem = reorderedAtivos.map((proj, idx) => ({
      id: proj.id,
      ordem: idx + 1
    }))

    const ordemMap = new Map(atualizacoesOrdem.map(u => [u.id, u.ordem]))
    const projetosAntigos = [...projetos]

    setProjetos(prev =>
      prev.map(p => {
        if (ordemMap.has(p.id)) {
          return { ...p, ordem: ordemMap.get(p.id)! }
        }
        return p
      })
    )

    try {
      await atualizarOrdemProjetos(atualizacoesOrdem)
    } catch (err: any) {
      console.error('Erro ao atualizar ordem dos projetos:', err)
      setProjetos(projetosAntigos)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleArquivarProjeto = async (projeto: Projeto) => {
    try {
      await arquivarProjeto(projeto.id)
      await carregarProjetos()
      showToast('Projeto arquivado!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null)
  const [projetoTemFases, setProjetoTemFases] = useState(false)
  const [projetoParaExcluir, setProjetoParaExcluir] = useState<{ projeto: Projeto; numRegistros: number } | null>(null)

  const carregarProjetos = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const dados = await listarProjetos(user.id, false)
      setProjetos(dados)
    } catch (err: any) {
      console.error('Erro ao listar projetos:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarProjetos()
  }, [user])

  const abrirNovoProjetoModal = () => {
    setEditingProjeto(null)
    setProjetoTemFases(false)
    setIsModalOpen(true)
  }

  const abrirEditarProjetoModal = async (projeto: Projeto) => {
    setProjetoTemFases(false)
    setEditingProjeto(projeto)
    setIsModalOpen(true)
    try {
      const fases = await fasesService.listarFases(projeto.id)
      setProjetoTemFases(fases.length > 0)
    } catch (err) {
      console.error('Erro ao verificar fases do projeto', err)
      setProjetoTemFases(false)
    }
  }

  const fecharModal = () => {
    setIsModalOpen(false)
    setEditingProjeto(null)
    setProjetoTemFases(false)
  }

  const handleSalvarProjeto = async (dados: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; horas_contratadas: number | null; status?: 'ativo' | 'encerrado' | 'excluido'; codigo_externo: string | null; billable: boolean }) => {
    if (!user) return

    try {
      if (editingProjeto) {
        // Atualizar projeto existente
        await atualizarProjeto(editingProjeto.id, {
          nome: dados.nome,
          cor: dados.cor,
          tipo: dados.tipo,
          horas_contratadas: dados.horas_contratadas,
          status: dados.status,
          codigo_externo: dados.codigo_externo,
          billable: dados.billable
        } as any)
        showToast('Projeto atualizado!', 'success')
      } else {
        // Criar novo projeto
        const novoProj = await criarProjeto({
          usuario_id: user.id,
          nome: dados.nome,
          cor: dados.cor,
          tipo: dados.tipo,
          horas_contratadas: dados.horas_contratadas,
          status: 'ativo',
          arquivado: false,
          nome_original: null,
          codigo_externo: dados.codigo_externo,
          billable: dados.billable
        } as any)
        showToast('Projeto criado!', 'success')

        if (novoProj.tipo === 'projeto') {
          navigate(`/projeto/${novoProj.id}?novo=1`)
        }
      }
      await carregarProjetos()
    } catch (err: any) {
      console.error('Erro ao salvar projeto:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleExcluirProjeto = async (projeto: Projeto) => {
    try {
      const { count, error } = await supabase
        .from('registros')
        .select('*', { count: 'exact', head: true })
        .eq('projeto_id', projeto.id)

      if (error) throw error

      if (count === 0) {
        if (window.confirm("Excluir projeto? Esta ação não pode ser desfeita.")) {
          await excluirProjeto(projeto.id)
          await carregarProjetos()
          showToast('Projeto excluído!', 'success')
        }
      } else {
        setProjetoParaExcluir({ projeto, numRegistros: count || 0 })
      }
    } catch (err: any) {
      console.error('Erro ao verificar registros:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleAlternarStatus = async (projeto: Projeto) => {
    try {
      setError(null)
      if (projeto.status === 'ativo') {
        await encerrarProjeto(projeto.id)
        showToast('Projeto encerrado.', 'info')
      } else {
        await reativarProjeto(projeto.id)
        showToast('Projeto reativado!', 'success')
      }
      await carregarProjetos()
    } catch (err: any) {
      console.error('Erro ao alternar status do projeto:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      
      <Sidebar />

      {/* 2. Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl lg:ml-[240px] space-y-6 w-full">
        
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-lg">
          <div>
            <h2 className="text-2xl font-bold text-ink-900 tracking-tight">Projetos</h2>
            <p className="text-sm text-ink-700">Gerencie seus projetos e clientes para associar aos seus lançamentos de horas.</p>
          </div>
          <Button
            variante="primario"
            className="min-h-[44px]"
            onClick={abrirNovoProjetoModal}
            iconeEsquerda={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-md h-icon-md" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Novo Projeto
          </Button>
        </div>

        {/* Abas Projetos / Rotina */}
        <div className="flex border-b border-hair gap-xl">
          <button
            onClick={() => setAbaAtiva('projeto')}
            className={`pt-2 pb-3 min-h-[44px] flex items-center text-sm font-bold transition-all relative ${
              abaAtiva === 'projeto'
                ? 'text-ink-900'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Projetos
            {abaAtiva === 'projeto' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
            )}
          </button>
          <button
            onClick={() => setAbaAtiva('rotina')}
            className={`pt-2 pb-3 min-h-[44px] flex items-center text-sm font-bold transition-all relative ${
              abaAtiva === 'rotina'
                ? 'text-ink-900'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Rotina
            {abaAtiva === 'rotina' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
            )}
          </button>
        </div>

        {/* Exibição de Mensagem de Erro */}
        {error && (
          <div className="p-4 bg-bad-bg border border-bad rounded-card text-bad text-sm flex items-center gap-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-md h-icon-md shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tabela ou Estado Vazio */}
        <Surface elevacao={1} padding="nenhum" comBorda className="overflow-hidden">
          {loading ? (
            <div className="flex flex-col">
              {[1, 2, 3].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : projetosFiltrados.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-full bg-surface-2 text-ink-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-icon-xl h-icon-xl" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-ink-900">Nenhum item encontrado</h3>
              <p className="text-sm text-ink-700">
                Você ainda não cadastrou nenhum{abaAtiva === 'projeto' ? 'o projeto' : 'a rotina'}. Comece criando um para organizar seus lançamentos de horas de forma profissional.
              </p>
              <Button
                variante="secundario"
                className="min-h-[44px]"
                onClick={abrirNovoProjetoModal}
              >
                Cadastrar Primeir{abaAtiva === 'projeto' ? 'o Projeto' : 'a Rotina'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={projetosAtivos.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full text-left border-collapse block md:table">
                    <thead className="hidden md:table-header-group">
                      <tr className="border-b border-hair bg-surface-2">
                        <th className="py-4 px-6 text-xs font-semibold text-ink-500 uppercase tracking-wider">Nome</th>
                        <th className="py-4 px-6 text-xs font-semibold text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 text-xs font-semibold text-ink-500 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hair block md:table-row-group">
                      {projetosFiltrados.map((projeto) => (
                        <ProjetoRowItem
                          key={projeto.id}
                          projeto={projeto}
                          abaAtiva={abaAtiva}
                          onEdit={abrirEditarProjetoModal}
                          onToggleStatus={handleAlternarStatus}
                          onExcluir={handleExcluirProjeto}
                          onArquivar={handleArquivarProjeto}
                          onNavigate={(id) => navigate(`/projeto/${id}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </Surface>

      </main>

      {/* Modal Reutilizável de Projeto */}
      <ModalProjeto
        isOpen={isModalOpen}
        onClose={fecharModal}
        onSave={handleSalvarProjeto}
        projeto={editingProjeto}
        temFases={projetoTemFases}
      />

      {projetoParaExcluir && (
        <div className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Surface
            elevacao={2}
            padding="lg"
            comBorda
            comSombra={false}
            className="w-full max-w-sm relative shadow-e3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink-900 mb-2">Este projeto possui {projetoParaExcluir.numRegistros} lançamentos</h3>
            <p className="text-sm text-ink-700 mb-6">
              O que deseja fazer?
            </p>
            <div className="flex flex-col gap-sm">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await encerrarProjeto(projetoParaExcluir.projeto.id)
                    setProjetoParaExcluir(null)
                    await carregarProjetos()
                    showToast('Projeto encerrado!', 'success')
                  } catch (err: any) {
                    showToast(getErrorMessage(err), 'error')
                  }
                }}
                className="w-full py-2.5 px-4 bg-warn-bg text-warn border border-warn hover:opacity-80 text-sm font-bold rounded-ctl transition-all min-h-[44px]"
              >
                Encerrar projeto
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await excluirProjetoComRegistros(projetoParaExcluir.projeto.id, projetoParaExcluir.projeto.nome)
                    setProjetoParaExcluir(null)
                    await carregarProjetos()
                    showToast('Projeto excluído!', 'success')
                  } catch (err: any) {
                    showToast(getErrorMessage(err), 'error')
                  }
                }}
                className="w-full py-2.5 px-4 bg-bad-bg text-bad border border-bad hover:opacity-80 text-sm font-bold rounded-ctl transition-all min-h-[44px]"
              >
                Excluir mesmo assim
              </button>
              <button
                type="button"
                onClick={() => setProjetoParaExcluir(null)}
                className="w-full py-2.5 px-4 bg-surface-2 hover:bg-surface-3 text-ink-700 hover:text-ink-900 text-sm font-semibold rounded-ctl transition-all border border-hair-strong min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </Surface>
        </div>
      )}
    </div>
  )
}
