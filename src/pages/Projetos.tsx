import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import {
  listarProjetos,
  criarProjeto,
  atualizarProjeto,
  encerrarProjeto,
  reativarProjeto,
  excluirProjeto
} from '../services/projetos'
import type { Projeto } from '../types'
import ModalProjeto from '../components/ModalProjeto'

export default function Projetos() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null)

  const carregarProjetos = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const dados = await listarProjetos(user.id)
      setProjetos(dados)
    } catch (err: any) {
      console.error('Erro ao listar projetos:', err)
      setError('Não foi possível carregar os projetos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarProjetos()
  }, [user])

  const abrirNovoProjetoModal = () => {
    setEditingProjeto(null)
    setIsModalOpen(true)
  }

  const abrirEditarProjetoModal = (projeto: Projeto) => {
    setEditingProjeto(projeto)
    setIsModalOpen(true)
  }

  const fecharModal = () => {
    setIsModalOpen(false)
    setEditingProjeto(null)
  }

  const handleSalvarProjeto = async (dados: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; horas_contratadas: number | null; status?: 'ativo' | 'encerrado' }) => {
    if (!user) return

    if (editingProjeto) {
      // Atualizar projeto existente
      await atualizarProjeto(editingProjeto.id, {
        nome: dados.nome,
        cor: dados.cor,
        tipo: dados.tipo,
        horas_contratadas: dados.horas_contratadas,
        status: dados.status
      })
    } else {
      // Criar novo projeto
      await criarProjeto({
        usuario_id: user.id,
        nome: dados.nome,
        cor: dados.cor,
        tipo: dados.tipo,
        horas_contratadas: dados.horas_contratadas,
        status: 'ativo'
      })
    }

    await carregarProjetos()
  }

  const handleExcluirProjeto = async (id: string) => {
    if (window.confirm("Excluir projeto? Esta ação não pode ser desfeita.")) {
      try {
        setError(null)
        await excluirProjeto(id)
        await carregarProjetos()
      } catch (err: any) {
        console.error('Erro ao excluir projeto:', err)
        setError('Não foi possível excluir o projeto. Verifique se ele possui registros associados.')
      }
    }
  }

  const handleAlternarStatus = async (projeto: Projeto) => {
    try {
      setError(null)
      if (projeto.status === 'ativo') {
        await encerrarProjeto(projeto.id)
      } else {
        await reativarProjeto(projeto.id)
      }
      await carregarProjetos()
    } catch (err: any) {
      console.error('Erro ao alternar status do projeto:', err)
      setError('Não foi possível atualizar o status do projeto.')
    }
  }

  // Verificar se o item de navegação está ativo
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      
      {/* 1. Sidebar Fixa à Esquerda */}
      <aside className="w-[240px] bg-[#161B22] border-r border-gray-800 flex flex-col shrink-0 min-h-screen">
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
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
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
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumo
          </Link>

          <Link
            to="/projetos"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/projetos')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
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
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* 2. Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-6">
        
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Projetos</h2>
            <p className="text-sm text-gray-400">Gerencie seus projetos e clientes para associar aos seus lançamentos de horas.</p>
          </div>
          <button
            onClick={abrirNovoProjetoModal}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-[#03A9F4] hover:bg-[#0091d2] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03A9F4]/20 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo Projeto
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
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin h-8 w-8 text-[#03A9F4]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-gray-400">Buscando seus projetos...</span>
            </div>
          ) : projetos.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Nenhum projeto encontrado</h3>
              <p className="text-sm text-gray-400">
                Você ainda não cadastrou nenhum projeto. Comece criando um para organizar seus lançamentos de horas de forma profissional.
              </p>
              <button
                onClick={abrirNovoProjetoModal}
                className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Cadastrar Primeiro Projeto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/30">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {projetos.map((projeto) => (
                    <tr key={projeto.id} className="hover:bg-gray-800/20 transition-all group">
                      <td className="py-4 px-6">
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
                      <td className="py-4 px-6">
                        {projeto.status === 'ativo' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            Encerrado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => abrirEditarProjetoModal(projeto)}
                            className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-all border border-gray-700/50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleAlternarStatus(projeto)}
                            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all border ${
                              projeto.status === 'ativo'
                                ? 'bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/30 text-orange-400 border-orange-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {projeto.status === 'ativo' ? 'Encerrar' : 'Reativar'}
                          </button>
                          <button
                            onClick={() => handleExcluirProjeto(projeto.id)}
                            className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-all border border-red-500/20"
                          >
                            Excluir
                          </button>
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
      />
    </div>
  )
}
