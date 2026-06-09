import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { buscarConfiguracoes, salvarConfiguracoes } from '../services/configuracoes'
import { listarHorariosSemana, salvarHorarioSemana, removerHorarioSemana } from '../services/horariosSemana'
import {
  salvarMetaBillableSemanal, listarHistoricoMetasSemanal,
  salvarMetaBillableMensal, listarHistoricoMetasMensal,
  salvarMargemMinima, listarHistoricoMargem,
  type MetaBillableSemanal, type MetaBillableMensal, type MetaBillableMargem
} from '../services/metas_billable'
import { getErrorMessage } from '../utils/errors'
import type { HorarioSemana } from '../types'
import { useToast } from '../contexts/ToastContext'
import { Skeleton, SkeletonLine } from '../components/Skeleton'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

export default function Ajustes() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Estados dos Campos de Configuração
  const [metaSemanal, setMetaSemanal] = useState<number>(42.5)
  const [inicioSemana, setInicioSemana] = useState<'segunda' | 'domingo'>('segunda')
  const [formatoHoras, setFormatoHoras] = useState<'decimal' | 'hhmm'>('decimal')
  const [inicioDia, setInicioDia] = useState<string>('08:00')
  const [fimDia, setFimDia] = useState<string>('18:00')
  const [saldoInicioSemana, setSaldoInicioSemana] = useState<string>('')

  // Estados de Exceções por Dia da Semana
  const [horariosSemana, setHorariosSemana] = useState<HorarioSemana[]>([])
  const [showNovoDia, setShowNovoDia] = useState(false)
  const [novoDiaSemana, setNovoDiaSemana] = useState<number>(1)
  const [novoInicioDia, setNovoInicioDia] = useState<string>('08:00')
  const [novoFimDia, setNovoFimDia] = useState<string>('18:00')
  const [savingDia, setSavingDia] = useState(false)

  const DIAS_SEMANA = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
  ]

  // Estados de UI/Feedback
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Estados Billable
  const [metaBillableSemanal, setMetaBillableSemanal] = useState<number>(0)
  const [historicoMetaSemanal, setHistoricoMetaSemanal] = useState<MetaBillableSemanal[]>([])
  const [savingMetaSemanal, setSavingMetaSemanal] = useState(false)

  const [metaBillableMensal, setMetaBillableMensal] = useState<number>(0)
  const [historicoMetaMensal, setHistoricoMetaMensal] = useState<MetaBillableMensal[]>([])
  const [savingMetaMensal, setSavingMetaMensal] = useState(false)

  const [margemMinima, setMargemMinima] = useState<number>(92.00)
  const [historicoMargem, setHistoricoMargem] = useState<MetaBillableMargem[]>([])
  const [savingMargem, setSavingMargem] = useState(false)

  const [semanaInicioMetaSemanal, setSemanaInicioMetaSemanal] = useState<string>(() => {
    const data = new Date()
    const dia = data.getDay()
    const diff = data.getDate() - dia + (dia === 0 ? -6 : 1)
    return new Date(data.setDate(diff)).toISOString().slice(0, 10)
  })
  const [verTodasMetaSemanal, setVerTodasMetaSemanal] = useState(false)

  const [mesInicioMetaMensal, setMesInicioMetaMensal] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [verTodasMetaMensal, setVerTodasMetaMensal] = useState(false)

  const [semanaInicioMargem, setSemanaInicioMargem] = useState<string>(() => {
    const data = new Date()
    const dia = data.getDay()
    const diff = data.getDate() - dia + (dia === 0 ? -6 : 1)
    return new Date(data.setDate(diff)).toISOString().slice(0, 10)
  })
  const [verTodasMargem, setVerTodasMargem] = useState(false)

  // Auxiliar para formatar data (safe fuso-horário) de YYYY-MM-DD para DD/MM/AAAA
  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '—'
    const partes = dataStr.split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return dataStr
  }

  // Lógica de exportação dos dados para Excel
  const handleExport = async () => {
    if (!user) return
    try {
      setExporting(true)

      // 1. Buscar registros ordenados por data asc
      const { data: registros, error: errorRegistros } = await supabase
        .from('registros')
        .select('data, hora_inicio, hora_fim, duracao, observacao, semana_inicio, projeto_id, projetos(nome, cor)')
        .eq('usuario_id', user.id)
        .order('data', { ascending: true })

      if (errorRegistros) throw errorRegistros

      // 2. Buscar projetos do usuário
      const { data: projetos, error: errorProjetos } = await supabase
        .from('projetos')
        .select('nome, cor, tipo, status, horas_contratadas, codigo_externo, arquivado')
        .eq('usuario_id', user.id)

      if (errorProjetos) throw errorProjetos

      // 3. Montar dados da Aba "Registros"
      const sheetRegistrosData = (registros || []).map((reg: any) => {
        let nomeProjeto = '—'
        if (reg.projetos) {
          if (Array.isArray(reg.projetos)) {
            nomeProjeto = reg.projetos[0]?.nome || '—'
          } else {
            nomeProjeto = reg.projetos.nome || '—'
          }
        }

        const duracaoFormatada = typeof reg.duracao === 'number'
          ? reg.duracao.toFixed(2).replace('.', ',')
          : '—'

        return {
          'Data': formatarData(reg.data),
          'Projeto': nomeProjeto,
          'Hora Início': reg.hora_inicio || '—',
          'Hora Fim': reg.hora_fim || '—',
          'Duração (h)': duracaoFormatada,
          'Semana': formatarData(reg.semana_inicio),
          'Observação': reg.observacao || ''
        }
      })

      // 4. Montar dados da Aba "Projetos"
      const sheetProjetosData = (projetos || []).map((proj: any) => {
        const tipoMapped = proj.tipo === 'projeto' ? 'Projeto' : proj.tipo === 'rotina' ? 'Rotina' : proj.tipo || '—'
        
        const statusMapped = proj.status === 'ativo' ? 'Ativo'
          : proj.status === 'encerrado' ? 'Encerrado'
          : proj.status === 'excluido' ? 'Excluído'
          : proj.status || '—'

        const arquivadoMapped = proj.arquivado ? 'Sim' : 'Não'
        const horasContratadasMapped = typeof proj.horas_contratadas === 'number'
          ? proj.horas_contratadas
          : '—'

        return {
          'Nome': proj.nome || '—',
          'Tipo': tipoMapped,
          'Status': statusMapped,
          'Horas Contratadas': horasContratadasMapped,
          'Código Externo': proj.codigo_externo || '—',
          'Arquivado': arquivadoMapped
        }
      })

      // 5. Montar dados da Aba "Configurações"
      const sheetConfigData = [
        { 'Campo': 'Meta Semanal', 'Valor': `${metaSemanal.toString().replace('.', ',')}h` },
        { 'Campo': 'Início da Semana', 'Valor': inicioSemana === 'segunda' ? 'Segunda-feira' : 'Domingo' },
        { 'Campo': 'Formato de Horas', 'Valor': formatoHoras === 'decimal' ? 'Decimal' : 'HH:MM' },
        { 'Campo': 'Início do Dia', 'Valor': inicioDia || '—' },
        { 'Campo': 'Fim do Dia', 'Valor': fimDia || '—' }
      ]

      // 6. Gerar e exportar o arquivo excel
      const wsRegistros = XLSX.utils.json_to_sheet(sheetRegistrosData)
      const wsProjetos = XLSX.utils.json_to_sheet(sheetProjetosData)
      const wsConfig = XLSX.utils.json_to_sheet(sheetConfigData)

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, wsRegistros, 'Registros')
      XLSX.utils.book_append_sheet(wb, wsProjetos, 'Projetos')
      XLSX.utils.book_append_sheet(wb, wsConfig, 'Configurações')

      const dataHoje = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `horas-backup-${dataHoje}.xlsx`)

      showToast('Backup exportado com sucesso!', 'success')
    } catch (err: any) {
      console.error('Erro ao exportar backup:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setExporting(false)
    }
  }

  // Carregar configurações do usuário ao montar
  const carregarConfiguracoes = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const [
        config,
        horariosSemanaData,
        histMetaSemanal,
        histMetaMensal,
        histMargem
      ] = await Promise.all([
        buscarConfiguracoes(user.id),
        listarHorariosSemana(user.id),
        listarHistoricoMetasSemanal(),
        listarHistoricoMetasMensal(),
        listarHistoricoMargem()
      ])
      
      setMetaSemanal(config.meta_semanal)
      setInicioSemana(config.inicio_semana)
      setFormatoHoras(config.formato_horas)
      setInicioDia(config.inicio_dia || '08:00')
      setFimDia(config.fim_dia || '18:00')
      setSaldoInicioSemana(config.saldo_inicio_semana ?? '')
      setHorariosSemana(horariosSemanaData)

      if (histMetaSemanal.length > 0) setMetaBillableSemanal(histMetaSemanal[0].meta)
      setHistoricoMetaSemanal(histMetaSemanal)

      if (histMetaMensal.length > 0) setMetaBillableMensal(histMetaMensal[0].meta)
      setHistoricoMetaMensal(histMetaMensal)

      if (histMargem.length > 0) setMargemMinima(histMargem[0].margem_minima)
      setHistoricoMargem(histMargem)

    } catch (err: any) {
      console.error('Erro ao buscar configurações:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarConfiguracoes()
  }, [user])

  function ajustarParaSegunda(dataStr: string): string {
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

  const handleSalvarMetaBillableSemanal = async () => {
    try {
      setSavingMetaSemanal(true)
      await salvarMetaBillableSemanal(metaBillableSemanal, ajustarParaSegunda(semanaInicioMetaSemanal))
      const hist = await listarHistoricoMetasSemanal()
      setHistoricoMetaSemanal(hist)
      showToast('Meta semanal billable salva!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSavingMetaSemanal(false)
    }
  }

  const handleSalvarMetaBillableMensal = async () => {
    try {
      setSavingMetaMensal(true)
      await salvarMetaBillableMensal(metaBillableMensal, mesInicioMetaMensal + '-01')
      const hist = await listarHistoricoMetasMensal()
      setHistoricoMetaMensal(hist)
      showToast('Meta mensal billable salva!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSavingMetaMensal(false)
    }
  }

  const handleSalvarMargem = async () => {
    try {
      setSavingMargem(true)
      await salvarMargemMinima(margemMinima, ajustarParaSegunda(semanaInicioMargem))
      const hist = await listarHistoricoMargem()
      setHistoricoMargem(hist)
      showToast('Margem mínima salva!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSavingMargem(false)
    }
  }

  // Lidar com Salvamento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setSaving(true)
      setError(null)

      await salvarConfiguracoes(user.id, {
        meta_semanal: metaSemanal,
        inicio_semana: inicioSemana,
        formato_horas: formatoHoras,
        inicio_dia: inicioDia,
        fim_dia: fimDia,
        saldo_inicio_semana: saldoInicioSemana || null
      })

      showToast('Configurações salvas!', 'success')
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDiaSemana = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setSavingDia(true)
      const novoHorario = await salvarHorarioSemana(user.id, novoDiaSemana, novoInicioDia, novoFimDia)
      setHorariosSemana(prev => {
        const filtrado = prev.filter(h => h.dia_semana !== novoDiaSemana)
        return [...filtrado, novoHorario].sort((a, b) => a.dia_semana - b.dia_semana)
      })
      setShowNovoDia(false)
      showToast('Horário salvo com sucesso!', 'success')
    } catch (err: any) {
      console.error('Erro ao salvar horário da semana:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSavingDia(false)
    }
  }

  const handleRemoverDia = async (id: string) => {
    try {
      await removerHorarioSemana(id)
      setHorariosSemana(prev => prev.filter(h => h.id !== id))
      showToast('Horário removido com sucesso!', 'success')
    } catch (err: any) {
      console.error('Erro ao remover horário:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const diasDisponiveis = DIAS_SEMANA.map((nome, index) => ({ nome, index }))
    .filter(d => !horariosSemana.some(h => h.dia_semana === d.index))

  // Incremento e Decremento da Meta Semanal
  const incrementarMeta = () => {
    setMetaSemanal((prev) => +(prev + 0.5).toFixed(1))
  }

  const decrementarMeta = () => {
    setMetaSemanal((prev) => (prev > 0.5 ? +(prev - 0.5).toFixed(1) : 0.5))
  }

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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* Sidebar de Navegação */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#161B22] border-r border-gray-800 flex flex-col shrink-0 min-h-screen transition-transform duration-300 transform lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:left-0 lg:top-0 lg:bottom-0`}>
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

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-3xl mx-auto space-y-6 lg:ml-[240px] w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Configurações</h1>
          <p className="text-sm text-gray-400">Personalize o comportamento e as metas do seu aplicativo.</p>
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
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <div className="space-y-1">
                  <SkeletonLine className="w-32 h-4" />
                  <SkeletonLine className="w-64 h-3" />
                </div>
                <Skeleton className="w-48 h-10 rounded-xl" />
              </div>
            ))}
            <div className="pt-4 border-t border-gray-800/80">
               <Skeleton className="w-48 h-12 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSave} className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
            
            {/* 1. Meta Semanal */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Horas Base Semanal</h3>
                <p className="text-xs text-gray-400">Defina o total de horas disponíveis por semana. A meta billable é calculada a partir deste valor.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[200px]">
                <button
                  type="button"
                  onClick={decrementarMeta}
                  className="w-10 h-10 bg-[#0B0E14] hover:bg-gray-800 border border-gray-800 text-white font-bold text-lg rounded-xl flex items-center justify-center focus:outline-none select-none transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={metaSemanal}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setMetaSemanal(isNaN(val) ? 0 : val)
                  }}
                  className="flex-1 bg-[#0B0E14] border border-gray-800 rounded-xl py-2 h-10 text-center font-mono font-bold text-white text-base focus:outline-none focus:border-[#03A9F4]"
                />
                <button
                  type="button"
                  onClick={incrementarMeta}
                  className="w-10 h-10 bg-[#0B0E14] hover:bg-gray-800 border border-gray-800 text-white font-bold text-lg rounded-xl flex items-center justify-center focus:outline-none select-none transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 2. Início da Semana */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Início da Semana</h3>
                <p className="text-xs text-gray-400">Escolha o dia em que o ciclo da semana se inicia para os resumos.</p>
              </div>
              <div className="flex justify-center sm:justify-start w-full">
                <div className="inline-flex bg-[#0B0E14] p-1 rounded-xl border border-gray-800 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setInicioSemana('segunda')}
                    className={`flex-1 sm:flex-initial py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                      inicioSemana === 'segunda'
                        ? 'bg-[#03A9F4] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Segunda-feira
                  </button>
                  <button
                    type="button"
                    onClick={() => setInicioSemana('domingo')}
                    className={`flex-1 sm:flex-initial py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                      inicioSemana === 'domingo'
                        ? 'bg-[#03A9F4] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Domingo
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Formato de Exibição das Horas */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Formato de Horas</h3>
                <p className="text-xs text-gray-400">Selecione como deseja visualizar as horas no aplicativo.</p>
              </div>
              <div className="flex justify-center sm:justify-start w-full">
                <div className="inline-flex bg-[#0B0E14] p-1 rounded-xl border border-gray-800 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFormatoHoras('decimal')}
                    className={`flex-1 sm:flex-initial py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                      formatoHoras === 'decimal'
                        ? 'bg-[#03A9F4] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Decimal (ex: 1,50h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatoHoras('hhmm')}
                    className={`flex-1 sm:flex-initial py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                      formatoHoras === 'hhmm'
                        ? 'bg-[#03A9F4] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    HH:MM (ex: 01:30)
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Horário Padrão do Dia */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Horário Padrão do Dia</h3>
                <p className="text-xs text-gray-400">Defina os horários de início e fim da sua jornada de trabalho.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-1.5 flex-1 w-full">
                  <label htmlFor="inicioDia" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Início
                  </label>
                  <input
                    id="inicioDia"
                    type="time"
                    value={inicioDia}
                    onChange={(e) => setInicioDia(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 w-full">
                  <label htmlFor="fimDia" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Fim
                  </label>
                  <input
                    id="fimDia"
                    type="time"
                    value={fimDia}
                    onChange={(e) => setFimDia(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 5. Exceções por Dia da Semana */}
            <div className="space-y-4 pt-4 border-t border-gray-800/80">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exceções por Dia da Semana</h3>
                <p className="text-xs text-[#8B949E] mt-1">Defina horários fixos para dias específicos da semana. Valem para novos lançamentos.</p>
              </div>

              {/* Lista de dias configurados */}
              {horariosSemana.length > 0 && (
                <div className="space-y-2">
                  {horariosSemana.map(h => (
                    <div key={h.id} className="flex items-center justify-between bg-[#0B0E14] border border-gray-800 rounded-xl p-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{DIAS_SEMANA[h.dia_semana]}</div>
                        <div className="text-xs text-[#8B949E]">{h.inicio_dia} às {h.fim_dia}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverDia(h.id)}
                        className="p-2 text-gray-500 hover:text-[#F44336] hover:bg-[#F44336]/10 rounded-lg transition-colors focus:outline-none"
                        title="Remover"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form de Adicionar Novo Dia */}
              {showNovoDia ? (
                <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Dia da Semana
                    </label>
                    <select
                      value={novoDiaSemana}
                      onChange={(e) => setNovoDiaSemana(Number(e.target.value))}
                      className="w-full bg-[#161B22] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                    >
                      {diasDisponiveis.map(d => (
                        <option key={d.index} value={d.index}>{d.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Início
                      </label>
                      <input
                        type="time"
                        value={novoInicioDia}
                        onChange={(e) => setNovoInicioDia(e.target.value)}
                        className="w-full bg-[#161B22] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Fim
                      </label>
                      <input
                        type="time"
                        value={novoFimDia}
                        onChange={(e) => setNovoFimDia(e.target.value)}
                        className="w-full bg-[#161B22] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNovoDia(false)}
                      className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all border border-gray-700 focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDiaSemana}
                      disabled={savingDia || diasDisponiveis.length === 0}
                      className="flex-1 py-2 px-4 bg-[#03A9F4] hover:bg-[#0288D1] text-white text-sm font-bold rounded-xl transition-all focus:outline-none disabled:opacity-50"
                    >
                      {savingDia ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                horariosSemana.length < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (diasDisponiveis.length > 0) {
                        setNovoDiaSemana(diasDisponiveis[0].index)
                        setShowNovoDia(true)
                      }
                    }}
                    className="flex items-center gap-2 text-[#03A9F4] hover:text-[#0288D1] text-sm font-bold transition-colors focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Adicionar dia
                  </button>
                )
              )}
            </div>

            {/* 6. Saldo Acumulado - Data de Início */}
            <div className="space-y-3 pt-4 border-t border-gray-800/80">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">SALDO ACUMULADO — DATA DE INÍCIO</h3>
                <p className="text-xs text-gray-400">O saldo acumulado será calculado a partir da semana selecionada.</p>
              </div>
              <div className="flex flex-col gap-1.5 max-w-[200px]">
                <label htmlFor="saldoInicioSemana" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  A partir de
                </label>
                <input
                  id="saldoInicioSemana"
                  type="date"
                  value={saldoInicioSemana}
                  onChange={(e) => setSaldoInicioSemana(e.target.value)}
                  className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors w-full"
                />
                {saldoInicioSemana && (
                  <span className="text-xs text-[#8B949E]">
                    Semana de {formatarData(ajustarParaSegunda(saldoInicioSemana))} (Seg)
                  </span>
                )}
              </div>
            </div>

            {/* Ação de Salvar */}
            <div className="pt-4 border-t border-gray-800/80">
              <button
                type="submit"
                disabled={saving || metaSemanal <= 0}
                className="w-full sm:w-auto py-3 px-6 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none shadow-lg shadow-[#03A9F4]/20"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando preferências...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </button>
            </div>

            </form>

            {/* Configurações Billable */}
            <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm mt-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Configurações Billable</h2>
                <p className="text-sm text-gray-400">Gerencie suas metas e margens de horas billable.</p>
              </div>

              {/* Meta Semanal Billable */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meta Semanal Billable</h3>
                  <p className="text-xs text-gray-400">Total de horas billable esperadas na semana.</p>
                </div>
                
                {/* Linha 1: Valores e Data */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      Meta (horas)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={metaBillableSemanal}
                      onChange={(e) => setMetaBillableSemanal(parseFloat(e.target.value) || 0)}
                      className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-center font-mono font-bold text-white text-base focus:outline-none focus:border-[#03A9F4] w-32"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      A partir de
                    </label>
                    <input
                      type="date"
                      value={semanaInicioMetaSemanal}
                      onChange={(e) => setSemanaInicioMetaSemanal(e.target.value)}
                      className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors w-44"
                    />
                    {semanaInicioMetaSemanal && (
                      <span className="text-xs text-[#8B949E]">
                        Semana de {formatarData(ajustarParaSegunda(semanaInicioMetaSemanal))} (Seg)
                      </span>
                    )}
                  </div>
                </div>

                {/* Linha 2: Salvar */}
                <div>
                  <button
                    type="button"
                    onClick={handleSalvarMetaBillableSemanal}
                    disabled={savingMetaSemanal}
                    className="py-2 px-4 bg-[#03A9F4] hover:bg-[#0288D1] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {savingMetaSemanal ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>

                {/* Histórico */}
                {historicoMetaSemanal.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      Histórico
                    </p>
                    <div className="border-l-2 border-dashed border-gray-800 ml-1 pl-3 space-y-2">
                      {(verTodasMetaSemanal ? historicoMetaSemanal : historicoMetaSemanal.slice(0, 3)).map((h, idx) => (
                        <div key={h.id} className="flex items-start gap-2">
                          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-[#4CAF50]' : 'bg-[#8B949E]'}`} />
                          <div>
                            <span className="text-sm text-white font-semibold">{h.meta}h</span>
                            <span className="text-xs text-[#8B949E]"> — a partir de {formatarData(h.semana_inicio)}</span>
                            <div className="text-xs text-gray-600">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {historicoMetaSemanal.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setVerTodasMetaSemanal(v => !v)}
                        className="text-xs text-[#8B949E] hover:text-white transition-colors focus:outline-none"
                      >
                        {verTodasMetaSemanal ? '▲ Ver menos' : `▾ Ver todas (${historicoMetaSemanal.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Meta Mensal Billable */}
              <div className="space-y-4 pt-4 border-t border-gray-800/80">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meta Mensal Billable</h3>
                  <p className="text-xs text-gray-400">Total de horas billable esperadas no mês.</p>
                </div>

                {/* Linha 1: Valores e Data */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      Meta (horas)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={metaBillableMensal}
                      onChange={(e) => setMetaBillableMensal(parseFloat(e.target.value) || 0)}
                      className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-center font-mono font-bold text-white text-base focus:outline-none focus:border-[#03A9F4] w-32"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      A partir de
                    </label>
                    <input
                      type="month"
                      value={mesInicioMetaMensal}
                      onChange={(e) => setMesInicioMetaMensal(e.target.value)}
                      className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors w-44"
                    />
                  </div>
                </div>

                {/* Linha 2: Salvar */}
                <div>
                  <button
                    type="button"
                    onClick={handleSalvarMetaBillableMensal}
                    disabled={savingMetaMensal}
                    className="py-2 px-4 bg-[#03A9F4] hover:bg-[#0288D1] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {savingMetaMensal ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>

                {/* Histórico */}
                {historicoMetaMensal.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      Histórico
                    </p>
                    <div className="border-l-2 border-dashed border-gray-800 ml-1 pl-3 space-y-2">
                      {(verTodasMetaMensal ? historicoMetaMensal : historicoMetaMensal.slice(0, 3)).map((h, idx) => (
                        <div key={h.id} className="flex items-start gap-2">
                          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-[#4CAF50]' : 'bg-[#8B949E]'}`} />
                          <div>
                            <span className="text-sm text-white font-semibold">{h.meta}h</span>
                            <span className="text-xs text-[#8B949E]"> — a partir de {formatarData(h.mes_inicio)}</span>
                            <div className="text-xs text-gray-600">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {historicoMetaMensal.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setVerTodasMetaMensal(v => !v)}
                        className="text-xs text-[#8B949E] hover:text-white transition-colors focus:outline-none"
                      >
                        {verTodasMetaMensal ? '▲ Ver menos' : `▾ Ver todas (${historicoMetaMensal.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Margem Mínima Billable */}
              <div className="space-y-4 pt-4 border-t border-gray-800/80">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Margem Mínima Billable</h3>
                  <p className="text-xs text-gray-400">Percentual de margem aceitável (ex: 92.00).</p>
                </div>

                {/* Linha 1: Valores e Data */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      Margem (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={margemMinima}
                        onChange={(e) => setMargemMinima(parseFloat(e.target.value) || 0)}
                        className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-center font-mono font-bold text-white text-base focus:outline-none focus:border-[#03A9F4] w-32"
                      />
                      <span className="text-white font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      A partir de
                    </label>
                    <input
                      type="date"
                      value={semanaInicioMargem}
                      onChange={(e) => setSemanaInicioMargem(e.target.value)}
                      className="bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors w-44"
                    />
                    {semanaInicioMargem && (
                      <span className="text-xs text-[#8B949E]">
                        Semana de {formatarData(ajustarParaSegunda(semanaInicioMargem))} (Seg)
                      </span>
                    )}
                  </div>
                </div>

                {/* Linha 2: Salvar */}
                <div>
                  <button
                    type="button"
                    onClick={handleSalvarMargem}
                    disabled={savingMargem}
                    className="py-2 px-4 bg-[#03A9F4] hover:bg-[#0288D1] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {savingMargem ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>

                {/* Histórico */}
                {historicoMargem.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                      Histórico
                    </p>
                    <div className="border-l-2 border-dashed border-gray-800 ml-1 pl-3 space-y-2">
                      {(verTodasMargem ? historicoMargem : historicoMargem.slice(0, 3)).map((h, idx) => (
                        <div key={h.id} className="flex items-start gap-2">
                          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-[#4CAF50]' : 'bg-[#8B949E]'}`} />
                          <div>
                            <span className="text-sm text-white font-semibold">{h.margem_minima}%</span>
                            <span className="text-xs text-[#8B949E]"> — a partir de {formatarData(h.semana_inicio)}</span>
                            <div className="text-xs text-gray-600">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {historicoMargem.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setVerTodasMargem(v => !v)}
                        className="text-xs text-[#8B949E] hover:text-white transition-colors focus:outline-none"
                      >
                        {verTodasMargem ? '▲ Ver menos' : `▾ Ver todas (${historicoMargem.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Backup de Dados */}
            <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm mt-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Backup de Dados</h3>
                <p className="text-xs text-gray-400">
                  Exporte todos os seus registros, projetos e configurações para um arquivo Excel (.xlsx).
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full sm:w-auto py-3 px-6 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none shadow-lg shadow-[#03A9F4]/20"
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Exportando...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Exportar para Excel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
