import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import {
  listarRegistros,
  excluirRegistro,
  criarRegistro,
  atualizarRegistro
} from '../services/registros'
import { listarProjetos } from '../services/projetos'
import { buscarConfiguracoes } from '../services/configuracoes'
import { listarHorariosDias, salvarHorarioDia } from '../services/horarios'
import type { Registro, Projeto, HorarioDia } from '../types'
import ModalRegistro from '../components/ModalRegistro'
import ModalHorarioDia from '../components/ModalHorarioDia'

// Helper para converter "HH:MM" em minutos para cálculo de gaps
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getWeekRange(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return { inicio: monday, fim: sunday }
}

function getWeekKey(dateStr: string) {
  const { inicio } = getWeekRange(dateStr)
  const y = inicio.getFullYear()
  const m = String(inicio.getMonth() + 1).padStart(2, '0')
  const d = String(inicio.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatWeekLabel(dateStr: string) {
  const { inicio, fim } = getWeekRange(dateStr)
  const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const d1 = String(inicio.getDate()).padStart(2, '0')
  const m1 = mesesAbrev[inicio.getMonth()]
  const d2 = String(fim.getDate()).padStart(2, '0')
  const m2 = mesesAbrev[fim.getMonth()]
  const y = fim.getFullYear()
  return `${d1} ${m1} a ${d2} ${m2} (${y})`
}

export default function Registros() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  // Estados dos Dados
  const [registros, setRegistros] = useState<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina' } | null })[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [configDia, setConfigDia] = useState<{ inicio: string, fim: string }>({ inicio: '08:00', fim: '18:00' })
  const [horariosExcecoes, setHorariosExcecoes] = useState<HorarioDia[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados dos Filtros
  const [filtroProjetoId, setFiltroProjetoId] = useState<string>('todos')
  const [filtroSemana, setFiltroSemana] = useState<string>('todas')
  const [filtroDiaEspecifico, setFiltroDiaEspecifico] = useState<string>('')
  const [diasExpandidos, setDiasExpandidos] = useState<{ [key: string]: boolean }>({})

  // Estados do Modal de Registros
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina' } | null }) | null>(null)

  // Estados do Modal de Horário do Dia
  const [isModalHorarioOpen, setIsModalHorarioOpen] = useState(false)
  const [modalHorarioData, setModalHorarioData] = useState<{
    data: string,
    inicio: string,
    fim: string
  } | null>(null)

  // Carregar dados iniciais
  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      // 1. Carregar Configurações
      const config = await buscarConfiguracoes(user.id)
      setConfigDia({ inicio: config.inicio_dia || '08:00', fim: config.fim_dia || '18:00' })

      // 2. Carregar Projetos
      const projs = await listarProjetos(user.id)
      setProjetos(projs)

      // 3. Carregar Exceções de Horários
      const excecoes = await listarHorariosDias(user.id)
      setHorariosExcecoes(excecoes)

      // 4. Carregar Registros
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

  // ===============================
  // LÓGICA DE REGISTROS (CRUD)
  // ===============================
  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de horas?')) return
    try {
      setError(null)
      await excluirRegistro(id)
      if (user) {
        const regs = await listarRegistros(user.id)
        setRegistros(regs)
      }
    } catch (err: any) {
      console.error('Erro ao excluir registro:', err)
      setError('Não foi possível excluir o registro de horas.')
    }
  }

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

  // ===============================
  // LÓGICA DE HORÁRIO DIÁRIO (CRUD)
  // ===============================
  const abrirModalHorario = (dataStr: string) => {
    const limits = getLimitesDia(dataStr)
    setModalHorarioData({
      data: dataStr,
      inicio: limits.inicio,
      fim: limits.fim
    })
    setIsModalHorarioOpen(true)
  }

  const handleSalvarHorarioDia = async (inicio: string, fim: string) => {
    if (!user || !modalHorarioData) return
    
    await salvarHorarioDia(user.id, modalHorarioData.data, inicio, fim)
    
    // Recarregar horários
    const excecoes = await listarHorariosDias(user.id)
    setHorariosExcecoes(excecoes)
  }

  // Pega os limites do dia (se houver exceção usa, senão usa config default)
  const getLimitesDia = (dataStr: string) => {
    const excecao = horariosExcecoes.find(h => h.data === dataStr)
    if (excecao) {
      return { inicio: excecao.inicio_dia, fim: excecao.fim_dia, customizado: true }
    }
    return { inicio: configDia.inicio, fim: configDia.fim, customizado: false }
  }


  // ===============================
  // FILTRAGEM E AGRUPAMENTO DIÁRIO
  // ===============================

  const toggleDia = (dataStr: string) => {
    setDiasExpandidos(prev => ({ ...prev, [dataStr]: prev[dataStr] !== undefined ? !prev[dataStr] : false }))
  }

  // Extrair semanas únicas disponíveis
  const semanasDisponiveis = useMemo(() => {
    const dates = registros.map((r) => r.data)
    const weeksMap = new Map<string, string>()
    dates.forEach(d => {
      const key = getWeekKey(d)
      if (!weeksMap.has(key)) {
        weeksMap.set(key, formatWeekLabel(d))
      }
    })
    return Array.from(weeksMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [registros])

  // Filtragem dos registros no Frontend
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      // 1. Filtrar por Projeto
      if (filtroProjetoId !== 'todos' && reg.projeto_id !== filtroProjetoId) {
        return false
      }
      // 2. Filtrar por Dia Específico ou Semana
      if (filtroDiaEspecifico) {
        if (reg.data !== filtroDiaEspecifico) {
          return false
        }
      } else {
        if (filtroSemana !== 'todas' && getWeekKey(reg.data) !== filtroSemana) {
          return false
        }
      }
      return true
    })
  }, [registros, filtroProjetoId, filtroSemana, filtroDiaEspecifico])

  // Formatar Título da Data (ex: "seg, 18 de mai")
  const formatarTituloData = (dataStr: string) => {
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    const [ry, rm, rd] = dataStr.split('-').map(Number)
    const dataDate = new Date(ry, rm - 1, rd)
    return `${diasSemana[dataDate.getDay()]}, ${String(rd).padStart(2, '0')} de ${mesesAbrev[rm - 1]} (${ry})`
  }

  // Agrupar registros filtrados por DATA e calcular Gaps
  const registrosAgrupadosPorData = useMemo(() => {
    const grupos: { [key: string]: typeof registrosFiltrados } = {}
    
    registrosFiltrados.forEach((reg) => {
      if (!grupos[reg.data]) grupos[reg.data] = []
      grupos[reg.data].push(reg)
    })

    // Ordenar as chaves (datas) de forma decrescente
    const datasOrdenadas = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

    return datasOrdenadas.map((dataStr) => {
      const records = grupos[dataStr]
      // Ordenar registros do dia por hora de inicio crescente
      records.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

      const limites = getLimitesDia(dataStr)
      
      // Calcular Total de Horas no Dia
      const totalHoras = records.reduce((acc, curr) => acc + curr.duracao, 0)
      
      // Array de itens (pode ser Registro ou Gap)
      const items: any[] = []

      // Verificar gap inicial (antes do primeiro registro)
      if (records.length > 0) {
        const minInicioDia = timeToMinutes(limites.inicio)
        const minPrimeiroReg = timeToMinutes(records[0].hora_inicio)
        const diffInic = minPrimeiroReg - minInicioDia
        if (diffInic >= 5) {
          items.push({ type: 'gap', label: 'Tempo vago', minutes: diffInic, inicio: limites.inicio, fim: records[0].hora_inicio })
        }
      }

      for (let i = 0; i < records.length; i++) {
        // Inserir o registro real
        items.push({ type: 'registro', data: records[i] })

        // Verificar gap entre este registro e o próximo
        if (i < records.length - 1) {
          const minAtualFim = timeToMinutes(records[i].hora_fim)
          const minProxInicio = timeToMinutes(records[i+1].hora_inicio)
          const diff = minProxInicio - minAtualFim
          if (diff >= 5) {
            items.push({ type: 'gap', label: 'Tempo vago', minutes: diff, inicio: records[i].hora_fim, fim: records[i+1].hora_inicio })
          }
        }
      }

      // Verificar gap final (depois do último registro)
      if (records.length > 0) {
        const lastReg = records[records.length - 1]
        const minUltimoReg = timeToMinutes(lastReg.hora_fim)
        const minFimDia = timeToMinutes(limites.fim)
        const diffFim = minFimDia - minUltimoReg
        if (diffFim >= 5) {
          items.push({ type: 'gap', label: 'Tempo vago', minutes: diffFim, inicio: lastReg.hora_fim, fim: limites.fim })
        }
      }

      return {
        data: dataStr,
        titulo: formatarTituloData(dataStr),
        limites,
        totalHoras,
        items
      }
    })
  }, [registrosFiltrados, horariosExcecoes, configDia])

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      
      {/* 1. Sidebar Fixa */}
      <aside className="w-[240px] bg-[#161B22] border-r border-gray-800 flex flex-col shrink-0 min-h-screen">
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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lançamento de Horas</h1>
            <p className="text-sm text-gray-400">Acompanhe seu progresso e identifique horas ociosas no seu dia.</p>
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
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
          {/* Projeto */}
          <div className="flex-1">
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

          {/* Semana */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Semana</label>
            <select
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              className="bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer"
            >
              <option value="todas">Todas as Semanas</option>
              {semanasDisponiveis.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Dia Específico */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dia Específico</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filtroDiaEspecifico}
                onChange={(e) => setFiltroDiaEspecifico(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-[#0B0E14] border border-[#374151] rounded-[8px] p-[10px] text-sm text-white focus:outline-none focus:border-[#03A9F4] w-full cursor-pointer"
              />
              {filtroDiaEspecifico && (
                <button
                  type="button"
                  onClick={() => setFiltroDiaEspecifico('')}
                  className="text-xs text-[#8B949E] hover:text-white transition-colors cursor-pointer whitespace-nowrap px-1"
                  title="Limpar data"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Lista de Registros Agrupados por Dia */}
        {loading ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#03A9F4]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-400">Carregando lançamentos...</span>
          </div>
        ) : registrosAgrupadosPorData.length === 0 ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum lançamento encontrado</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Não encontramos nenhum registro de horas para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {registrosAgrupadosPorData.map((grupo) => {
              const isExpanded = diasExpandidos[grupo.data] !== false
              
              return (
                <div key={grupo.data} className="relative">
                  <div className="flex flex-col">
                    {/* Cabeçalho do Grupo de Dia */}
                    <div 
                      className="bg-[#1E2530] border-l-[3px] border-l-[#03A9F4] rounded-lg px-4 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer hover:bg-[#252d3a] transition-colors relative z-10"
                      onClick={() => toggleDia(grupo.data)}
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                            <span className="capitalize normal-case">{grupo.titulo}</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            Jornada: <span className="font-mono text-gray-300">{grupo.limites.inicio.slice(0, 5)} às {grupo.limites.fim.slice(0, 5)}</span>
                            {grupo.limites.customizado && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 border border-amber-500/20">Modificado</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Lançado</span>
                          <span className="text-lg font-mono font-bold text-emerald-400">
                            {grupo.totalHoras.toFixed(2).replace('.', ',')}h
                          </span>
                        </div>
                        <span className="h-8 w-px bg-gray-800 hidden sm:inline" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirModalHorario(grupo.data)
                          }}
                          className="p-2 text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 rounded-xl transition-all focus:outline-none"
                          title="Editar Horário do Dia"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="sr-only">Editar Horário do Dia</span>
                        </button>
                      </div>
                    </div>

                    {/* Lançamentos e Gaps */}
                    <div className={`flex flex-col gap-1 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                      {grupo.items.map((item, index) => {
                        // ==== RENDERIZAÇÃO DO GAP ====
                        if (item.type === 'gap') {
                          const h = Math.floor(item.minutes / 60)
                          const m = item.minutes % 60
                          let descStr = ''
                          if (h === 0) descStr = `${m}min disponíveis`
                          else if (m === 0) descStr = `${h}h disponíveis`
                          else descStr = `${h}h ${m}min disponíveis`

                          return (
                            <div key={`gap-${index}`} className="flex items-center gap-3 px-4 py-1.5 text-sm bg-red-500/10 border-l-2 border-red-500/30 text-red-400">
                              <span className="text-[10px]">○</span>
                              <span className="font-mono">{item.inicio.slice(0, 5)} → {item.fim.slice(0, 5)}</span>
                              <span className="mx-1">·</span>
                              <span>{descStr}</span>
                            </div>
                          )
                        }

                        // ==== RENDERIZAÇÃO DO REGISTRO ====
                        const reg = item.data as (Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina' } | null })
                        const projCor = reg.projeto?.cor || '#6B7280'
                        const projNome = reg.projeto?.nome || 'Sem Projeto'

                        return (
                          <div key={reg.id} className="bg-[#161B22] p-3 rounded-lg flex flex-col md:flex-row items-center gap-4 hover:bg-[#1a212a] transition-colors group">
                            {/* Tag do Projeto */}
                            <div className="w-full md:w-[120px] shrink-0">
                              {reg.projeto?.tipo === 'rotina' ? (
                                <span
                                  className="inline-flex items-center gap-1 py-1 px-2 rounded-[4px] text-[11px] font-semibold border max-w-full bg-transparent"
                                  style={{ 
                                    borderColor: projCor,
                                    color: projCor
                                  }}
                                >
                                  <span className="truncate">· {projNome}</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold border max-w-full"
                                  style={{ 
                                    backgroundColor: `${projCor}12`, 
                                    borderColor: `${projCor}44`,
                                    color: projCor
                                  }}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: projCor }} />
                                  <span className="truncate">{projNome}</span>
                                </span>
                              )}
                            </div>

                            {/* Horários */}
                            <div className="w-full md:w-[130px] shrink-0 text-left md:text-center">
                              <span className="text-sm font-mono font-semibold text-gray-300">
                                {reg.hora_inicio.slice(0, 5)} <span className="text-gray-500">→</span> {reg.hora_fim.slice(0, 5)}
                              </span>
                            </div>

                            {/* Observação */}
                            <div className="flex-grow min-w-0 w-full text-left">
                              {reg.observacao ? (
                                <span 
                                  className="text-sm text-gray-400 block truncate"
                                  title={reg.observacao}
                                >
                                  {reg.observacao}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-600 italic"></span>
                              )}
                            </div>

                            {/* Duração */}
                            <div className="w-full md:w-[80px] shrink-0 text-left md:text-right">
                              <span className="text-sm font-mono font-bold text-[#03A9F4]">
                                {reg.duracao.toFixed(2).replace('.', ',')}h
                              </span>
                            </div>

                            {/* Ações */}
                            <div className="w-full md:w-[60px] shrink-0 flex gap-1 justify-start md:justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => abrirEditarRegistroModal(reg)}
                                className="p-1.5 text-gray-500 hover:text-white transition-colors focus:outline-none"
                                title="Editar Lançamento"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleExcluir(reg.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors focus:outline-none"
                                title="Excluir Lançamento"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
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

      </main>

      {/* Modal Registro */}
      <ModalRegistro
        isOpen={isModalOpen}
        onClose={fecharModal}
        onSave={handleSalvarRegistro}
        registro={editingRegistro}
        registrosExistentes={registros}
      />

      {/* Modal Horário Dia */}
      {modalHorarioData && (
        <ModalHorarioDia
          isOpen={isModalHorarioOpen}
          onClose={() => setIsModalHorarioOpen(false)}
          onSave={handleSalvarHorarioDia}
          dataSelecionada={modalHorarioData.data}
          inicioAtual={modalHorarioData.inicio}
          fimAtual={modalHorarioData.fim}
        />
      )}
    </div>
  )
}
