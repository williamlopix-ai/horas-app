import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  listarRegistros,
  excluirRegistro,
  criarRegistro,
  atualizarRegistro
} from '../services/registros'
import { listarProjetos } from '../services/projetos'
import type { Registro, Projeto } from '../types'
import ModalRegistro from '../components/ModalRegistro'

export default function Registros() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Estados dos Dados
  const [registros, setRegistros] = useState<(Registro & { projeto: { nome: string; cor: string } | null })[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [metaSemanal, setMetaSemanal] = useState<number>(40) // Default meta
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados dos Filtros
  const [filtroProjetoId, setFiltroProjetoId] = useState<string>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos') // todos, 7dias, 30dias, esteMes
  const [filtroSemana, setFiltroSemana] = useState<string>('todas')

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<(Registro & { projeto: { nome: string; cor: string } | null }) | null>(null)

  // Carregar dados iniciais
  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      // 1. Carregar Configurações (Meta Semanal)
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle()

      if (configData) {
        setMetaSemanal(configData.meta_semanal)
      }

      // 2. Carregar Projetos
      const projs = await listarProjetos(user.id)
      setProjetos(projs)

      // 3. Carregar Registros
      const regs = await listarRegistros(user.id)
      setRegistros(regs)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError('Ocorreu um erro ao carregar as informações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user])

  // Lidar com Exclusão
  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de horas?')) return
    try {
      setError(null)
      await excluirRegistro(id)
      // Recarregar registros
      if (user) {
        const regs = await listarRegistros(user.id)
        setRegistros(regs)
      }
    } catch (err: any) {
      console.error('Erro ao excluir registro:', err)
      setError('Não foi possível excluir o registro de horas.')
    }
  }

  // Lidar com Salvamento do Modal (Criar/Editar)
  const handleSalvarRegistro = async (dados: {
    projeto_id: string | null
    data: string
    hora_inicio: string
    hora_fim: string
    observacao: string | null
  }) => {
    if (!user) return

    if (editingRegistro) {
      await atualizarRegistro(editingRegistro.id, dados)
    } else {
      await criarRegistro({
        usuario_id: user.id,
        projeto_id: dados.projeto_id,
        data: dados.data,
        hora_inicio: dados.hora_inicio,
        hora_fim: dados.hora_fim,
        observacao: dados.observacao
      })
    }

    // Recarregar lista
    const regs = await listarRegistros(user.id)
    setRegistros(regs)
    fecharModal()
  }

  const abrirNovoRegistroModal = () => {
    setEditingRegistro(null)
    setIsModalOpen(true)
  }

  const abrirEditarRegistroModal = (reg: any) => {
    setEditingRegistro(reg)
    setIsModalOpen(true)
  }

  const fecharModal = () => {
    setIsModalOpen(false)
    setEditingRegistro(null)
  }

  // Filtragem dos registros no Frontend (combina projeto, período e semana para performance e fluidez)
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      // 1. Filtrar por Projeto
      if (filtroProjetoId !== 'todos' && reg.projeto_id !== filtroProjetoId) {
        return false
      }

      // 2. Filtrar por Período
      if (filtroPeriodo !== 'todos') {
        const dataReg = new Date(reg.data + 'T00:00:00')
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        if (filtroPeriodo === '7dias') {
          const limite = new Date(hoje)
          limite.setDate(hoje.getDate() - 7)
          if (dataReg < limite) return false
        } else if (filtroPeriodo === '30dias') {
          const limite = new Date(hoje)
          limite.setDate(hoje.getDate() - 30)
          if (dataReg < limite) return false
        } else if (filtroPeriodo === 'esteMes') {
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          if (dataReg < inicioMes) return false
        }
      }

      // 3. Filtrar por Semana
      if (filtroSemana !== 'todas' && reg.semana_inicio !== filtroSemana) {
        return false
      }

      return true
    })
  }, [registros, filtroProjetoId, filtroPeriodo, filtroSemana])

  // Extrair semanas únicas disponíveis para o filtro de semanas
  const semanasDisponiveis = useMemo(() => {
    const semanas = registros.map((r) => r.semana_inicio).filter(Boolean) as string[]
    return Array.from(new Set(semanas)).sort((a, b) => b.localeCompare(a))
  }, [registros])

  // Formatar Título da Semana (ex: "18 mai a 24 mai (2026)")
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

  // Agrupar registros filtrados por semana_inicio
  const registrosAgrupadosPorSemana = useMemo(() => {
    const grupos: { [key: string]: typeof registrosFiltrados } = {}
    
    registrosFiltrados.forEach((reg) => {
      const semana = reg.semana_inicio || 'sem-semana'
      if (!grupos[semana]) {
        grupos[semana] = []
      }
      grupos[semana].push(reg)
    })

    // Ordenar chaves das semanas decrescente
    return Object.keys(grupos)
      .sort((a, b) => b.localeCompare(a))
      .map((semana) => ({
        semana_inicio: semana,
        titulo: semana === 'sem-semana' ? 'Lançamentos Sem Semana' : formatarTituloSemana(semana),
        registros: grupos[semana],
        totalHoras: grupos[semana].reduce((acc, curr) => acc + curr.duracao, 0)
      }))
  }, [registrosFiltrados])

  // Verificar link ativo na Sidebar
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      
      {/* 1. Sidebar Fixa */}
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
            to="/dashboard"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/dashboard')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

          <button
            disabled
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold text-gray-600 cursor-not-allowed text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ajustes <span className="ml-auto text-[10px] font-bold bg-gray-800 text-gray-500 py-0.5 px-1.5 rounded">BREVE</span>
          </button>
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
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lançamento de Horas</h1>
            <p className="text-sm text-gray-400">Controle e visualize todas as suas horas lançadas.</p>
          </div>
          <button
            onClick={abrirNovoRegistroModal}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-[#03A9F4] hover:bg-[#0091d2] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#03A9F4]/20 focus:outline-none shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo Registro
          </button>
        </div>

        {/* Mensagem de erro se houver */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* 3. Filtros */}
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Projeto */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Projeto</label>
            <select
              value={filtroProjetoId}
              onChange={(e) => setFiltroProjetoId(e.target.value)}
              className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer"
            >
              <option value="todos">Todos os Projetos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Período</label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer"
            >
              <option value="todos">Todo o Histórico</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="esteMes">Este mês</option>
            </select>
          </div>

          {/* Semana */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filtrar por Semana</label>
            <select
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer"
            >
              <option value="todas">Todas as Semanas</option>
              {semanasDisponiveis.map((sem) => (
                <option key={sem} value={sem}>{formatarTituloSemana(sem)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Lista de Registros ou Estado Vazio */}
        {loading ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#03A9F4]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-400">Carregando lançamentos...</span>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum lançamento encontrado</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Não encontramos nenhum registro de horas para os filtros selecionados. Comece criando um novo registro para acompanhar sua produtividade!
            </p>
            <button
              onClick={abrirNovoRegistroModal}
              className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Lançar Primeiras Horas
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {registrosAgrupadosPorSemana.map((grupo) => {
              const atingiuMeta = grupo.totalHoras >= metaSemanal
              const percentual = Math.min(100, Math.round((grupo.totalHoras / metaSemanal) * 100))

              return (
                <div key={grupo.semana_inicio} className="space-y-3">
                  {/* Cabeçalho do Grupo de Semana */}
                  <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                        Semana: <span className="text-[#03A9F4] lowercase font-semibold normal-case">{grupo.titulo}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold">Total:</span>
                        <span className={`text-sm font-mono font-bold ${atingiuMeta ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {grupo.totalHoras.toFixed(2).replace('.', ',')}h
                        </span>
                        <span className="text-xs text-gray-600">/</span>
                        <span className="text-xs text-gray-500 font-mono">{metaSemanal.toFixed(2).replace('.', ',')}h (meta)</span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="space-y-1">
                      <div className="w-full bg-[#0B0E14] h-2.5 rounded-full overflow-hidden border border-gray-800/50">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            atingiuMeta 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20' 
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          }`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-semibold font-mono">
                        <span>{percentual}% da meta semanal atingida</span>
                        {atingiuMeta && <span className="text-emerald-400 flex items-center gap-1">Meta Batida! 🏆</span>}
                      </div>
                    </div>
                  </div>

                  {/* Lançamentos da Semana */}
                  <div className="space-y-2.5">
                    {grupo.registros.map((reg) => {
                      const projCor = reg.projeto?.cor || '#6B7280'
                      const projNome = reg.projeto?.nome || 'Sem Projeto'
                      
                      // Formatar Data (ex: "seg, 18 de mai")
                      const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                      const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
                      const [ry, rm, rd] = reg.data.split('-').map(Number)
                      const dataDate = new Date(ry, rm - 1, rd)
                      const dataFormatada = `${diasSemana[dataDate.getDay()]}, ${rd} de ${mesesAbrev[rm - 1]}`

                      return (
                        <div
                          key={reg.id}
                          className="bg-[#161B22]/40 hover:bg-[#161B22]/80 border border-gray-800/60 hover:border-gray-700/80 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all group shadow-sm"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Tag do Projeto */}
                            <span
                              className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold border"
                              style={{ 
                                backgroundColor: `${projCor}12`, 
                                borderColor: `${projCor}44`,
                                color: projCor
                              }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: projCor }} />
                              {projNome}
                            </span>

                            {/* Data */}
                            <span className="text-sm font-semibold text-gray-300">{dataFormatada}</span>

                            <span className="h-3 w-px bg-gray-800 hidden sm:inline" />

                            {/* Hora de Início e Fim */}
                            <span className="text-sm font-mono text-gray-400">
                              {reg.hora_inicio} às {reg.hora_fim}
                            </span>
                          </div>

                          {/* Observação, Duração e Ações */}
                          <div className="w-full md:w-auto flex flex-col sm:flex-row justify-between md:justify-end items-start sm:items-center gap-4 shrink-0">
                            {/* Observação */}
                            {reg.observacao && (
                              <span 
                                className="text-xs text-gray-500 italic max-w-[200px] truncate"
                                title={reg.observacao}
                              >
                                "{reg.observacao}"
                              </span>
                            )}

                            {/* Duração Centesimal */}
                            <div className="flex items-center gap-1 bg-gray-900/50 border border-gray-800/80 py-1 px-2.5 rounded-lg">
                              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total:</span>
                              <span className="text-sm font-mono font-bold text-white">
                                {reg.duracao.toFixed(2).replace('.', ',')}h
                              </span>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => abrirEditarRegistroModal(reg)}
                                className="p-1.5 bg-gray-800/50 hover:bg-gray-700/80 active:bg-gray-600/80 text-gray-400 hover:text-white rounded-lg border border-gray-800/60 transition-all"
                                title="Editar Lançamento"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleExcluir(reg.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 rounded-lg border border-red-500/20 transition-all"
                                title="Excluir Lançamento"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>

      {/* Modal Registro */}
      <ModalRegistro
        isOpen={isModalOpen}
        onClose={fecharModal}
        onSave={handleSalvarRegistro}
        registro={editingRegistro}
      />
    </div>
  )
}
