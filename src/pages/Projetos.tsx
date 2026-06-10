import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link, useLocation } from 'react-router-dom'
import {
  listarProjetos,
  criarProjeto,
  atualizarProjeto,
  encerrarProjeto,
  reativarProjeto,
  excluirProjeto,
  excluirProjetoComRegistros,
  arquivarProjeto
} from '../services/projetos'
import { supabase } from '../lib/supabase'
import { getErrorMessage } from '../utils/errors'
import type { Projeto } from '../types'
import ModalProjeto from '../components/ModalProjeto'
import { SkeletonRow } from '../components/Skeleton'

export default function Projetos() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<'projeto' | 'rotina'>('projeto')

  const projetosFiltrados = useMemo(() => {
    return projetos.filter(p => (p.tipo || 'projeto') === abaAtiva && !p.arquivado)
  }, [projetos, abaAtiva])

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null)
  const [focarSubcategorias, setFocarSubcategorias] = useState(false)
  const [projetoRecemCriado, setProjetoRecemCriado] = useState<Projeto | null>(null)
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
    setFocarSubcategorias(false)
    setIsModalOpen(true)
  }

  const abrirEditarProjetoModal = (projeto: Projeto, focarSubs = false) => {
    setEditingProjeto(projeto)
    setFocarSubcategorias(focarSubs)
    setIsModalOpen(true)
  }

  const fecharModal = () => {
    setIsModalOpen(false)
    setEditingProjeto(null)
    setFocarSubcategorias(false)
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
        
        // Se for do tipo 'projeto', exibe dialog para oferecer subcategorias
        if (novoProj.tipo === 'projeto') {
          setProjetoRecemCriado(novoProj)
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

  // Verificar se o item de navegação está ativo
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

      {/* 1. Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#161B22] border-r border-gray-800 flex flex-col shrink-0 min-h-screen transition-transform duration-300 transform lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:left-0 lg:top-0 lg:bottom-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#03A9F4]/10 text-[#03A9F4]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HORAS</span>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            to="/registros"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/registros')
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
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/resumo')
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
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/timesheet')
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
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/billable')
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
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/projetos')
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
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/ajustes')
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

        {/* User Profile / Logout */}
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

      {/* 2. Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl lg:ml-[240px] space-y-6 w-full">
        
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Projetos</h2>
            <p className="text-sm text-gray-400">Gerencie seus projetos e clientes para associar aos seus lançamentos de horas.</p>
          </div>
          <button
            onClick={abrirNovoProjetoModal}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03A9F4]/20 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo Projeto
          </button>
        </div>

        {/* Abas Projetos / Rotina */}
        <div className="flex border-b border-gray-800 gap-6">
          <button
            onClick={() => setAbaAtiva('projeto')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              abaAtiva === 'projeto'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Projetos
            {abaAtiva === 'projeto' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#03A9F4]" />
            )}
          </button>
          <button
            onClick={() => setAbaAtiva('rotina')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              abaAtiva === 'rotina'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Rotina
            {abaAtiva === 'rotina' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#03A9F4]" />
            )}
          </button>
        </div>

        {/* Exibição de Mensagem de Erro */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tabela ou Estado Vazio */}
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col">
              {[1, 2, 3].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : projetosFiltrados.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Nenhum item encontrado</h3>
              <p className="text-sm text-gray-400">
                Você ainda não cadastrou nenhum{abaAtiva === 'projeto' ? 'o projeto' : 'a rotina'}. Comece criando um para organizar seus lançamentos de horas de forma profissional.
              </p>
              <button
                onClick={abrirNovoProjetoModal}
                className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Cadastrar Primeir{abaAtiva === 'projeto' ? 'o Projeto' : 'a Rotina'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse block md:table">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-gray-800 bg-gray-900/30">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 block md:table-row-group">
                  {projetosFiltrados.map((projeto) => (
                    <tr key={projeto.id} className="hover:bg-gray-800/20 transition-all group flex flex-col md:table-row p-4 md:p-0 gap-2.5 md:gap-0 border-b border-gray-800/40 md:border-b-0">
                      <td className="block md:table-cell py-1 md:py-4 px-0 md:px-6">
                        <div className="flex items-center gap-3">
                          <span 
                            className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0 shadow-sm"
                            style={{ backgroundColor: projeto.cor }}
                          />
                          <span className="font-semibold text-white group-hover:text-[#03A9F4] transition-colors">
                            {projeto.nome}
                          </span>
                        </div>
                      </td>
                      <td className="block md:table-cell py-1 md:py-4 px-0 md:px-6">
                        {projeto.status === 'ativo' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Ativo
                          </span>
                        ) : projeto.status === 'encerrado' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                            Encerrado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Excluído
                          </span>
                        )}
                      </td>
                      <td className="block md:table-cell py-1 md:py-4 px-0 md:px-6 text-left md:text-right">
                        <div className="flex flex-col sm:flex-row md:inline-flex gap-2 w-full md:w-auto">
                          {projeto.status === 'excluido' ? (
                            <>
                              <span className="inline-flex items-center justify-center py-1.5 px-3 bg-gray-800/50 text-gray-500 text-xs font-semibold rounded-lg border border-gray-700/30 w-full sm:w-auto text-center">
                                Excluído
                              </span>
                              <button
                                onClick={async () => {
                                  try {
                                    await arquivarProjeto(projeto.id)
                                    await carregarProjetos()
                                    showToast('Projeto arquivado!', 'success')
                                  } catch (err: any) {
                                    showToast(getErrorMessage(err), 'error')
                                  }
                                }}
                                className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-all border border-gray-700/50 w-full sm:w-auto text-center justify-center"
                              >
                                Arquivar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => abrirEditarProjetoModal(projeto)}
                                className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-all border border-gray-700/50 w-full sm:w-auto text-center justify-center"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleAlternarStatus(projeto)}
                                className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all border w-full sm:w-auto text-center justify-center ${
                                  projeto.status === 'ativo'
                                    ? 'bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/30 text-orange-400 border-orange-500/20'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {projeto.status === 'ativo' ? 'Encerrar' : 'Reativar'}
                              </button>
                              <button
                                onClick={() => handleExcluirProjeto(projeto)}
                                className="py-1.5 px-3 bg-red-500/10 hover:bg-red-600 hover:text-white active:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-all border border-red-500/20 w-full sm:w-auto text-center justify-center"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Modal Reutilizável de Projeto */}
      <ModalProjeto
        isOpen={isModalOpen}
        onClose={fecharModal}
        onSave={handleSalvarProjeto}
        projeto={editingProjeto}
        focarSubcategorias={focarSubcategorias}
      />

      {/* Dialog de Confirmação para Adicionar Subcategorias */}
      {projetoRecemCriado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">Projeto criado!</h3>
            <p className="text-sm text-gray-400 mb-6">
              Deseja adicionar subcategorias agora?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = projetoRecemCriado
                  setProjetoRecemCriado(null)
                  abrirEditarProjetoModal(p, true)
                }}
                className="w-full py-2.5 px-4 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03A9F4]/10"
              >
                Adicionar subcategorias
              </button>
              <button
                type="button"
                onClick={() => setProjetoRecemCriado(null)}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-semibold rounded-xl transition-all border border-gray-700/50"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
      {projetoParaExcluir && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">Este projeto possui {projetoParaExcluir.numRegistros} lançamentos</h3>
            <p className="text-sm text-gray-400 mb-6">
              O que deseja fazer?
            </p>
            <div className="flex flex-col gap-2">
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
                className="w-full py-2.5 px-4 bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/30 text-orange-400 border border-orange-500/20 text-sm font-bold rounded-xl transition-all"
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
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-600 hover:text-white active:bg-red-500/30 text-red-400 border border-red-500/20 text-sm font-bold rounded-xl transition-all"
              >
                Excluir mesmo assim
              </button>
              <button
                type="button"
                onClick={() => setProjetoParaExcluir(null)}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-semibold rounded-xl transition-all border border-gray-700/50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
