import React, { useEffect, useState, useMemo } from 'react'
import { ChevronDown, AlertTriangle, Trash2, Plus, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import { useConfig } from '../contexts/ConfigContext'
import { listarHorariosSemana, salvarHorarioSemana, removerHorarioSemana } from '../services/horariosSemana'
import {
  salvarMargemMinima, listarHistoricoMargem,
  salvarMargemMinimaMensal, listarHistoricoMargemMensal,
  type MetaBillableMargem, type MetaBillableMargemMensal
} from '../services/metas_billable'
import {
  salvarHorasBaseSemanal, listarHistoricoHorasBaseSemanal,
  salvarHorasBaseMensal, listarHistoricoHorasBaseMensal,
  excluirHorasBaseSemanalAPartirDe,
  type HorasBaseSemanal, type HorasBaseMensal
} from '../services/horas_base'
import { getErrorMessage } from '../utils/errors'
import type { HorarioSemana } from '../types'
import { useToast } from '../contexts/ToastContext'
import { Skeleton, SkeletonLine } from '../components/Skeleton'
import { Surface, classeCampo, Button, Chip } from '../components/ui'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { inicioDaSemana, intervaloDaSemana, formatYYYYMMDD, type InicioSemana } from '../utils/semana'

export default function Ajustes() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { config, salvarConfig } = useConfig()

  // Estados dos Campos de Configuração
  const [inicioSemana, setInicioSemana] = useState<InicioSemana>('segunda')
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
  const [openBillableSection, setOpenBillableSection] = useState<string | null>(null)

  // Helpers
  const getSemanaAtual = () => {
    const data = new Date()
    const dia = data.getDay()
    const diff = data.getDate() - dia + (dia === 0 ? -6 : 1)
    return new Date(data.setDate(diff)).toISOString().slice(0, 10)
  }

  const getMesAtualStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  // Estados Billable
  // Horas Base Semanal
  const [horasBaseSemanal, setHorasBaseSemanal] = useState<number>(42.5)
  const [semanaInicioHorasBase, setSemanaInicioHorasBase] = useState<string>(() => getSemanaAtual())
  const [historicoHorasBaseSemanal, setHistoricoHorasBaseSemanal] = useState<HorasBaseSemanal[]>([])
  const [savingHorasBaseSemanal, setSavingHorasBaseSemanal] = useState(false)
  const [verTodasHorasBaseSemanal, setVerTodasHorasBaseSemanal] = useState(false)
  const [modoMetaPosterior, setModoMetaPosterior] = useState<'manter' | 'substituir'>('substituir')

  interface FaixaHorasBaseSemanal {
    semana_inicio: string
    vencedora: HorasBaseSemanal
    substituidas: HorasBaseSemanal[]
    fim: string | null
  }

  const [substituidasAbertas, setSubstituidasAbertas] = useState<Record<string, boolean>>({})

  const toggleSubstituidas = (semanaInicio: string) => {
    setSubstituidasAbertas(prev => ({
      ...prev,
      [semanaInicio]: !prev[semanaInicio]
    }))
  }

  const faixasHorasBaseSemanal = useMemo<FaixaHorasBaseSemanal[]>(() => {
    if (!historicoHorasBaseSemanal || historicoHorasBaseSemanal.length === 0) return []

    const grupos = new Map<string, HorasBaseSemanal[]>()
    for (const item of historicoHorasBaseSemanal) {
      const list = grupos.get(item.semana_inicio) || []
      list.push(item)
      grupos.set(item.semana_inicio, list)
    }

    const faixasBrutas: Array<{
      semana_inicio: string
      vencedora: HorasBaseSemanal
      substituidas: HorasBaseSemanal[]
    }> = []

    for (const [semanaInicio, itens] of grupos.entries()) {
      const ordenados = [...itens].sort((a, b) => b.criado_em.localeCompare(a.criado_em))
      faixasBrutas.push({
        semana_inicio: semanaInicio,
        vencedora: ordenados[0],
        substituidas: ordenados.slice(1)
      })
    }

    faixasBrutas.sort((a, b) => b.semana_inicio.localeCompare(a.semana_inicio))

    return faixasBrutas.map((faixa, index) => {
      let fim: string | null = null
      if (index > 0) {
        const proximaSemanaInicioStr = faixasBrutas[index - 1].semana_inicio
        const [y, m, d] = proximaSemanaInicioStr.split('-').map(Number)
        const dtProxima = new Date(y, m - 1, d)
        dtProxima.setDate(dtProxima.getDate() - 1)
        fim = formatYYYYMMDD(dtProxima)
      }
      return {
        ...faixa,
        fim
      }
    })
  }, [historicoHorasBaseSemanal])

  // Horas Base Mensal
  const [horasBaseMensal, setHorasBaseMensal] = useState<number>(170)
  const [mesInicioHorasBase, setMesInicioHorasBase] = useState<string>(() => getMesAtualStr())
  const [historicoHorasBaseMensal, setHistoricoHorasBaseMensal] = useState<HorasBaseMensal[]>([])
  const [savingHorasBaseMensal, setSavingHorasBaseMensal] = useState(false)
  const [verTodasHorasBaseMensal, setVerTodasHorasBaseMensal] = useState(false)

  const [margemMinima, setMargemMinima] = useState<number>(92.00)
  const [historicoMargem, setHistoricoMargem] = useState<MetaBillableMargem[]>([])
  const [savingMargem, setSavingMargem] = useState(false)

  // Margem Mínima Mensal
  const [margemMinimaMensal, setMargemMinimaMensal] = useState<number>(92)
  const [mesInicioMargemMensal, setMesInicioMargemMensal] = useState<string>(() => getMesAtualStr())
  const [historicoMargemMensal, setHistoricoMargemMensal] = useState<MetaBillableMargemMensal[]>([])
  const [savingMargemMensal, setSavingMargemMensal] = useState(false)
  const [verTodasMargemMensal, setVerTodasMargemMensal] = useState(false)



  const [semanaInicioMargem, setSemanaInicioMargem] = useState<string>(() => getSemanaAtual())
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

  const formatarDataCurta = (dataStr: string | null) => {
    if (!dataStr) return '—'
    const partes = dataStr.split('-')
    if (partes.length === 3) return `${partes[2]}/${partes[1]}`
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
        { 'Campo': 'Meta Semanal', 'Valor': `${horasBaseSemanal.toString().replace('.', ',')}h` },
        { 'Campo': 'Início da Semana', 'Valor': inicioSemana === 'segunda' ? 'Segunda-feira' : inicioSemana === 'sabado' ? 'Sábado' : 'Domingo' },
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
        horariosSemanaData,
        histMargem,
        histHorasBaseSemanal,
        histHorasBaseMensal,
        histMargemMensal
      ] = await Promise.all([
        listarHorariosSemana(user.id),
        listarHistoricoMargem(),
        listarHistoricoHorasBaseSemanal(),
        listarHistoricoHorasBaseMensal(),
        listarHistoricoMargemMensal()
      ])

      setHorariosSemana(horariosSemanaData)

      if (histMargem.length > 0) setMargemMinima(histMargem[0].margem_minima)
      setHistoricoMargem(histMargem)

      if (histHorasBaseSemanal.length > 0) setHorasBaseSemanal(histHorasBaseSemanal[0].horas_base)
      setHistoricoHorasBaseSemanal(histHorasBaseSemanal)

      if (histHorasBaseMensal.length > 0) setHorasBaseMensal(histHorasBaseMensal[0].horas_base)
      setHistoricoHorasBaseMensal(histHorasBaseMensal)

      if (histMargemMensal.length > 0) setMargemMinimaMensal(histMargemMensal[0].margem_minima)
      setHistoricoMargemMensal(histMargemMensal)

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

  useEffect(() => {
    setInicioSemana(config.inicio_semana)
    setFormatoHoras(config.formato_horas)
    setInicioDia(config.inicio_dia || '08:00')
    setFimDia(config.fim_dia || '18:00')
    setSaldoInicioSemana(config.saldo_inicio_semana ?? '')
  }, [config])

  function ajustarParaInicioSemana(dataStr: string): string {
    return inicioDaSemana(dataStr, inicioSemana)
  }

  function formatarIntervaloSemana(dataStr: string, prefixo: string = 'Semana de '): string {
    if (!dataStr) return ''
    const { inicio, fim } = intervaloDaSemana(dataStr, inicioSemana)
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
    
    const d1 = String(inicio.getDate()).padStart(2, '0')
    const m1 = String(inicio.getMonth() + 1).padStart(2, '0')
    const ds1 = dias[inicio.getDay()]
    
    const d2 = String(fim.getDate()).padStart(2, '0')
    const m2 = String(fim.getMonth() + 1).padStart(2, '0')
    const ds2 = dias[fim.getDay()]
    
    return `${prefixo}${ds1} ${d1}/${m1} a ${ds2} ${d2}/${m2}`
  }

  const getDadosConfirmacaoMetaSemanal = () => {
    if (!semanaInicioHorasBase) return null

    const semanaEscolhida = ajustarParaInicioSemana(semanaInicioHorasBase)
    const [y, m, d] = semanaEscolhida.split('-').map(Number)
    const dtAnterior = new Date(y, m - 1, d)
    dtAnterior.setDate(dtAnterior.getDate() - 7)
    const semanaAnteriorStr = formatYYYYMMDD(dtAnterior)

    const historicoFiltrado = historicoHorasBaseSemanal
      .filter(h => h.semana_inicio <= semanaAnteriorStr)
      .sort((a, b) => {
        if (a.semana_inicio !== b.semana_inicio) {
          return b.semana_inicio.localeCompare(a.semana_inicio)
        }
        return b.criado_em.localeCompare(a.criado_em)
      })

    const entradaAnterior = historicoFiltrado.length > 0 ? historicoFiltrado[0] : null

    let datasSemanaAnteriorStr = ''
    if (entradaAnterior) {
      const { inicio: iPrev, fim: fPrev } = intervaloDaSemana(semanaAnteriorStr, inicioSemana)
      const d1Prev = String(iPrev.getDate()).padStart(2, '0')
      const m1Prev = String(iPrev.getMonth() + 1).padStart(2, '0')
      const d2Prev = String(fPrev.getDate()).padStart(2, '0')
      const m2Prev = String(fPrev.getMonth() + 1).padStart(2, '0')
      datasSemanaAnteriorStr = `${d1Prev}/${m1Prev} a ${d2Prev}/${m2Prev}`
    }

    const faixasPosteriores = faixasHorasBaseSemanal
      .filter(f => f.semana_inicio > semanaEscolhida)
      .sort((a, b) => a.semana_inicio.localeCompare(b.semana_inicio))

    const faixaPosterior = faixasPosteriores.length > 0 ? faixasPosteriores[0] : null
    let diaAnteriorFaixaPosteriorStr = ''
    if (faixaPosterior) {
      const [yP, mP, dP] = faixaPosterior.semana_inicio.split('-').map(Number)
      const dtDiaAnterior = new Date(yP, mP - 1, dP)
      dtDiaAnterior.setDate(dtDiaAnterior.getDate() - 1)
      diaAnteriorFaixaPosteriorStr = formatYYYYMMDD(dtDiaAnterior)
    }

    return {
      semanaEscolhida,
      entradaAnterior,
      datasSemanaAnteriorStr,
      faixaPosterior,
      qtdFaixasPosteriores: faixasPosteriores.length,
      diaAnteriorFaixaPosteriorStr
    }
  }

  const handleSalvarHorasBaseSemanal = async () => {
    if (horasBaseSemanal <= 0) return
    try {
      setSavingHorasBaseSemanal(true)
      const semanaEscolhida = ajustarParaInicioSemana(semanaInicioHorasBase)
      const faixasPosteriores = faixasHorasBaseSemanal.filter(f => f.semana_inicio > semanaEscolhida)
      const temPosterior = faixasPosteriores.length > 0

      if (temPosterior && modoMetaPosterior === 'substituir') {
        await salvarHorasBaseSemanal(horasBaseSemanal, semanaEscolhida)
        await excluirHorasBaseSemanalAPartirDe(semanaEscolhida)
        const n = faixasPosteriores.length
        const texto = n === 1 ? '1 meta posterior removida.' : `${n} metas posteriores removidas.`
        showToast(`Meta semanal salva. ${texto}`, 'success')
      } else {
        await salvarHorasBaseSemanal(horasBaseSemanal, semanaEscolhida)
        showToast('Horas base semanal salvas!', 'success')
      }

      setModoMetaPosterior('substituir')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      try {
        const hist = await listarHistoricoHorasBaseSemanal()
        setHistoricoHorasBaseSemanal(hist)
      } catch (histErr) {
        console.error('Erro ao recarregar histórico de horas base semanal:', histErr)
      }
      setSavingHorasBaseSemanal(false)
    }
  }

  const handleSalvarHorasBaseMensal = async () => {
    if (horasBaseMensal <= 0) return
    try {
      setSavingHorasBaseMensal(true)
      await salvarHorasBaseMensal(horasBaseMensal, mesInicioHorasBase + '-01')
      const hist = await listarHistoricoHorasBaseMensal()
      setHistoricoHorasBaseMensal(hist)
      showToast('Horas base mensal salvas!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSavingHorasBaseMensal(false)
    }
  }

  const handleSalvarMargemMensal = async () => {
    if (margemMinimaMensal < 1 || margemMinimaMensal > 100) return
    try {
      setSavingMargemMensal(true)
      await salvarMargemMinimaMensal(margemMinimaMensal, mesInicioMargemMensal + '-01')
      const hist = await listarHistoricoMargemMensal()
      setHistoricoMargemMensal(hist)
      showToast('Margem mínima mensal salva!', 'success')
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSavingMargemMensal(false)
    }
  }

  const handleSalvarMargem = async () => {
    try {
      setSavingMargem(true)
      await salvarMargemMinima(margemMinima, ajustarParaInicioSemana(semanaInicioMargem))
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

      await salvarConfig({
        meta_semanal: config.meta_semanal,
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



  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">

      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-3xl mx-auto space-y-6 lg:ml-[240px] w-full">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Configurações</h1>
          <p className="text-sm text-ink-500">Personalize o comportamento e as metas do seu aplicativo.</p>
        </div>

        {error && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
            className="p-4 bg-bad-bg border rounded-card text-bad text-sm flex items-center gap-3"
          >
            <AlertTriangle className="w-icon-md h-icon-md shrink-0 text-bad" />
            <span className="font-ui">{error}</span>
          </div>
        )}

        {loading ? (
          <Surface elevacao={1} comBorda padding="nenhum" className="p-6 md:p-8 space-y-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <div className="space-y-1">
                  <SkeletonLine className="w-32 h-4" />
                  <SkeletonLine className="w-64 h-3" />
                </div>
                <Skeleton className="w-48 h-10 rounded-ctl" />
              </div>
            ))}
            <div className="pt-4 border-t border-hair">
              <Skeleton className="w-48 h-12 rounded-ctl" />
            </div>
          </Surface>
        ) : (
          <>
            <form onSubmit={handleSave} className="bg-surface-1 border border-hair rounded-card p-6 md:p-8 space-y-8 shadow-e1">



              {/* 2. Início da Semana */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Início da Semana</h3>
                  <p className="text-xs text-ink-500">Escolha o dia em que o ciclo da semana se inicia para os resumos.</p>
                </div>
                <div className="flex justify-center sm:justify-start w-full">
                  <div className="flex bg-surface-1 p-0.5 sm:p-1 rounded-ctl border border-hair w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setInicioSemana('sabado')}
                      className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${inicioSemana === 'sabado'
                        ? 'bg-accent-bg text-accent-fg'
                        : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                      Sábado
                    </button>
                    <button
                      type="button"
                      onClick={() => setInicioSemana('segunda')}
                      className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${inicioSemana === 'segunda'
                        ? 'bg-accent-bg text-accent-fg'
                        : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                      Segunda-feira
                    </button>
                    <button
                      type="button"
                      onClick={() => setInicioSemana('domingo')}
                      className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${inicioSemana === 'domingo'
                        ? 'bg-accent-bg text-accent-fg'
                        : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                      Domingo
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta Semanal */}
              <div className="space-y-4 pt-4 border-t border-hair">
                <div>
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Meta Semanal</h3>
                  <p className="text-xs text-ink-500">
                    Total de horas que você se compromete a lançar por semana. Vale a partir da semana escolhida, sem alterar semanas anteriores.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Linha 1: Valores e Data */}
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                        Horas
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={horasBaseSemanal}
                        onChange={(e) => setHorasBaseSemanal(parseFloat(e.target.value) || 0)}
                        className={`${classeCampo()} !w-32 text-center font-mono font-bold text-base min-h-[44px]`}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                        A partir de
                      </label>
                      <input
                        type="date"
                        value={semanaInicioHorasBase}
                        onChange={(e) => setSemanaInicioHorasBase(e.target.value)}
                        className={`${classeCampo()} !w-44 font-mono text-sm min-h-[44px]`}
                      />
                    </div>
                  </div>

                  {/* Bloco de Confirmação de Vigência */}
                  {semanaInicioHorasBase && (
                    <div className="bg-surface-0 border border-hair rounded-card p-3 text-xs text-ink-500 space-y-1">
                      <p>
                        Nova meta: <span className="text-ink-900 font-bold">{horasBaseSemanal.toString().replace('.', ',')}h</span>
                      </p>
                      <p>
                        Vale a partir da {formatarIntervaloSemana(semanaInicioHorasBase, 'semana de ')}
                      </p>
                      {(() => {
                        const dados = getDadosConfirmacaoMetaSemanal()
                        if (!dados) return null
                        return (
                          <>
                            {dados.entradaAnterior && (
                              <p>
                                A semana anterior ({dados.datasSemanaAnteriorStr}) continua com <span className="text-ink-900 font-bold">{dados.entradaAnterior.horas_base.toString().replace('.', ',')}h</span>
                              </p>
                            )}
                            {dados.faixaPosterior && (
                              <div className="mt-3 pt-3 border-t border-hair space-y-3">
                                <p className="text-ink-900 font-medium text-xs">
                                  Já existe meta cadastrada depois desta data. O que fazer?
                                </p>
                                <div className="space-y-2">
                                  <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="modoMetaPosterior"
                                      value="manter"
                                      checked={modoMetaPosterior === 'manter'}
                                      onChange={() => setModoMetaPosterior('manter')}
                                      className="mt-0.5"
                                      style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <div>
                                      <p className="text-ink-900 text-xs font-semibold">Manter as metas seguintes</p>
                                      <p className="text-xs text-ink-500">
                                        {horasBaseSemanal.toString().replace('.', ',')}h vale de {formatarDataCurta(dados.semanaEscolhida)} a {formatarDataCurta(dados.diaAnteriorFaixaPosteriorStr)}, e a partir de {formatarDataCurta(dados.faixaPosterior.semana_inicio)} volta a valer {dados.faixaPosterior.vencedora.horas_base.toString().replace('.', ',')}h
                                      </p>
                                    </div>
                                  </label>

                                  <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="modoMetaPosterior"
                                      value="substituir"
                                      checked={modoMetaPosterior === 'substituir'}
                                      onChange={() => setModoMetaPosterior('substituir')}
                                      className="mt-0.5"
                                      style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <div>
                                      <p className="text-ink-900 text-xs font-semibold">Substituir as metas seguintes</p>
                                      <p className="text-xs text-ink-500">
                                        {horasBaseSemanal.toString().replace('.', ',')}h vale de {formatarDataCurta(dados.semanaEscolhida)} em diante. {dados.qtdFaixasPosteriores === 1 ? '1 meta posterior será removida.' : `${dados.qtdFaixasPosteriores} metas posteriores serão removidas.`}
                                      </p>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Linha: Salvar */}
                  <div>
                    <Button
                      variante="primario"
                      tamanho="md"
                      type="button"
                      onClick={handleSalvarHorasBaseSemanal}
                      disabled={savingHorasBaseSemanal}
                      className="min-h-[44px]"
                    >
                      {savingHorasBaseSemanal ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>

                  {/* Histórico */}
                  {faixasHorasBaseSemanal.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                        Histórico
                      </p>
                      <div className="border-l-2 border-dashed border-hair ml-1 pl-3 space-y-3">
                        {(verTodasHorasBaseSemanal ? faixasHorasBaseSemanal : faixasHorasBaseSemanal.slice(0, 3)).map((faixa, idx) => {
                          const isVigente = idx === 0
                          const temSubstituidas = faixa.substituidas.length > 0
                          const aberta = substituidasAbertas[faixa.semana_inicio] || false

                          return (
                            <div key={faixa.semana_inicio} className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isVigente ? 'bg-ok' : 'bg-ink-500'}`} />
                                <span className="text-sm text-ink-900 font-semibold tabular-nums">
                                  {faixa.vencedora.horas_base.toString().replace('.', ',')}h
                                </span>
                                <span className="text-xs text-ink-500 tabular-nums">
                                  {isVigente
                                    ? `de ${formatarDataCurta(faixa.semana_inicio)} até hoje`
                                    : `de ${formatarDataCurta(faixa.semana_inicio)} a ${formatarDataCurta(faixa.fim)}`
                                  }
                                </span>
                                {isVigente && (
                                  <Chip tom="ok">vigente</Chip>
                                )}
                              </div>

                              {temSubstituidas && (
                                <div className="pl-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleSubstituidas(faixa.semana_inicio)}
                                    className="text-xs text-ink-500 hover:text-ink-700 transition-colors duration-d1 ease-ez focus:outline-none flex items-center gap-1 py-2 min-h-[44px]"
                                  >
                                    <span>{aberta ? '▲' : '▾'}</span>
                                    <span>
                                      {faixa.substituidas.length} {faixa.substituidas.length === 1 ? 'alteração anterior' : 'alterações anteriores'}
                                    </span>
                                  </button>

                                  {aberta && (
                                    <div className="mt-1.5 space-y-1 border-l border-hair pl-2.5">
                                      {faixa.substituidas.map(sub => (
                                        <div key={sub.id} className="text-xs text-ink-500 tabular-nums flex items-center gap-2">
                                          <span className="font-medium">{sub.horas_base.toString().replace('.', ',')}h</span>
                                          <span>•</span>
                                          <span>{new Date(sub.criado_em).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {faixasHorasBaseSemanal.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setVerTodasHorasBaseSemanal(v => !v)}
                          className="text-xs text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez focus:outline-none py-2 min-h-[44px] inline-flex items-center"
                        >
                          {verTodasHorasBaseSemanal ? '▲ Ver menos' : `▾ Ver todas (${faixasHorasBaseSemanal.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Formato de Exibição das Horas */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Formato de Horas</h3>
                  <p className="text-xs text-ink-500">Selecione como deseja visualizar as horas no aplicativo.</p>
                </div>
                <div className="flex justify-center sm:justify-start w-full">
                  <div className="flex bg-surface-1 p-0.5 sm:p-1 rounded-ctl border border-hair w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setFormatoHoras('decimal')}
                      className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${formatoHoras === 'decimal'
                        ? 'bg-accent-bg text-accent-fg'
                        : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                      Decimal (ex: 1,50h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormatoHoras('hhmm')}
                      className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-ctl transition-colors duration-d1 ease-ez focus:outline-none ${formatoHoras === 'hhmm'
                        ? 'bg-accent-bg text-accent-fg'
                        : 'text-ink-500 hover:text-ink-900'
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
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Horário Padrão do Dia</h3>
                  <p className="text-xs text-ink-500">Defina os horários de início e fim da sua jornada de trabalho.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 flex-1 w-full">
                    <label htmlFor="inicioDia" className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                      Início
                    </label>
                    <input
                      id="inicioDia"
                      type="time"
                      value={inicioDia}
                      onChange={(e) => setInicioDia(e.target.value)}
                      className={`${classeCampo()} font-mono text-sm min-h-[44px]`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 w-full">
                    <label htmlFor="fimDia" className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                      Fim
                    </label>
                    <input
                      id="fimDia"
                      type="time"
                      value={fimDia}
                      onChange={(e) => setFimDia(e.target.value)}
                      className={`${classeCampo()} font-mono text-sm min-h-[44px]`}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Exceções por Dia da Semana */}
              <div className="space-y-4 pt-4 border-t border-hair">
                <div>
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Exceções por Dia da Semana</h3>
                  <p className="text-xs text-ink-500 mt-1">Defina horários fixos para dias específicos da semana. Valem para novos lançamentos.</p>
                </div>

                {/* Lista de dias configurados */}
                {horariosSemana.length > 0 && (
                  <div className="space-y-2">
                    {horariosSemana.map(h => (
                      <div key={h.id} className="flex items-center justify-between bg-surface-0 border border-hair rounded-card p-3">
                        <div>
                          <div className="text-sm font-semibold text-ink-900">{DIAS_SEMANA[h.dia_semana]}</div>
                          <div className="text-xs text-ink-500 tabular-nums">{h.inicio_dia} às {h.fim_dia}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverDia(h.id)}
                          className="p-2 text-ink-500 hover:text-bad hover:bg-bad-bg rounded-ctl transition-colors duration-d1 ease-ez min-h-[44px] min-w-[44px] focus:outline-none"
                          title="Remover"
                        >
                          <Trash2 className="w-icon-md h-icon-md" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form de Adicionar Novo Dia */}
                {showNovoDia ? (
                  <div className="bg-surface-0 border border-hair rounded-card p-4 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                        Dia da Semana
                      </label>
                      <select
                        value={novoDiaSemana}
                        onChange={(e) => setNovoDiaSemana(Number(e.target.value))}
                        className={`${classeCampo()} min-h-[44px] cursor-pointer`}
                      >
                        {diasDisponiveis.map(d => (
                          <option key={d.index} value={d.index}>{d.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Início
                        </label>
                        <input
                          type="time"
                          value={novoInicioDia}
                          onChange={(e) => setNovoInicioDia(e.target.value)}
                          className={`${classeCampo()} font-mono text-sm min-h-[44px]`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Fim
                        </label>
                        <input
                          type="time"
                          value={novoFimDia}
                          onChange={(e) => setNovoFimDia(e.target.value)}
                          className={`${classeCampo()} font-mono text-sm min-h-[44px]`}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variante="secundario"
                        tamanho="md"
                        type="button"
                        onClick={() => setShowNovoDia(false)}
                        className="flex-1 min-h-[44px]"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variante="primario"
                        tamanho="md"
                        type="button"
                        onClick={handleAddDiaSemana}
                        disabled={savingDia || diasDisponiveis.length === 0}
                        className="flex-1 min-h-[44px]"
                      >
                        {savingDia ? 'Salvando...' : 'Salvar'}
                      </Button>
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
                      className="flex items-center gap-2 text-accent hover:text-accent-fg text-sm font-bold transition-colors duration-d1 ease-ez min-h-[44px] focus:outline-none"
                    >
                      <Plus className="w-icon-md h-icon-md" />
                      Adicionar dia
                    </button>
                  )
                )}
              </div>

              {/* Ação de Salvar */}
              <div className="pt-4 border-t border-hair">
                <Button
                  variante="primario"
                  tamanho="md"
                  type="submit"
                  disabled={saving}
                  carregando={saving}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  {saving ? 'Salvando preferências...' : 'Salvar Configurações'}
                </Button>
              </div>

            </form>

            {/* Configurações Billable */}
            <div className="bg-surface-1 border border-hair rounded-card p-6 md:p-8 space-y-8 shadow-e1 mt-6">
              <div>
                <h2 className="text-lg font-bold font-display text-ink-900 tracking-tight">Configurações Billable</h2>
                <p className="text-sm text-ink-500">Gerencie suas metas e margens de horas billable.</p>
              </div>

              {/* Horas Base Mensal */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setOpenBillableSection(openBillableSection === 'horasBaseMensal' ? null : 'horasBaseMensal')}
                  className="w-full flex items-center justify-between text-left min-h-[44px] focus:outline-none"
                >
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Horas Base Mensal</h3>
                    <p className="text-xs text-ink-500">Total de horas disponíveis por mês. Se não configurado, usa base semanal × 4.</p>
                  </div>
                  <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 shrink-0 ml-4 transition-transform duration-d5 ${openBillableSection === 'horasBaseMensal' ? 'rotate-0' : '-rotate-90'}`} />
                </button>
                {openBillableSection === 'horasBaseMensal' && (
                  <div className="space-y-4 mt-4">
                    {/* Linha 1: Valores e Data */}
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Horas
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={horasBaseMensal}
                          onChange={(e) => setHorasBaseMensal(parseFloat(e.target.value) || 0)}
                          className={`${classeCampo()} !w-32 text-center font-mono font-bold text-base min-h-[44px]`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          A partir de
                        </label>
                        <input
                          type="month"
                          value={mesInicioHorasBase}
                          onChange={(e) => setMesInicioHorasBase(e.target.value)}
                          className={`${classeCampo()} !w-44 font-mono text-sm min-h-[44px]`}
                        />
                      </div>
                    </div>

                    {/* Linha 2: Salvar */}
                    <div>
                      <Button
                        variante="primario"
                        tamanho="md"
                        type="button"
                        onClick={handleSalvarHorasBaseMensal}
                        disabled={savingHorasBaseMensal}
                        className="min-h-[44px]"
                      >
                        {savingHorasBaseMensal ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>

                    {/* Histórico */}
                    {historicoHorasBaseMensal.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Histórico
                        </p>
                        <div className="border-l-2 border-dashed border-hair ml-1 pl-3 space-y-2">
                          {(verTodasHorasBaseMensal ? historicoHorasBaseMensal : historicoHorasBaseMensal.slice(0, 3)).map((h, idx) => (
                            <div key={h.id} className="flex items-start gap-2">
                              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-ok' : 'bg-ink-500'}`} />
                              <div>
                                <span className="text-sm text-ink-900 font-semibold tabular-nums">{h.horas_base}h</span>
                                <span className="text-xs text-ink-500 tabular-nums"> — a partir de {formatarData(h.mes_inicio)}</span>
                                <div className="text-xs text-ink-500 tabular-nums">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {historicoHorasBaseMensal.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setVerTodasHorasBaseMensal(v => !v)}
                            className="text-xs text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez focus:outline-none py-2 min-h-[44px] inline-flex items-center"
                          >
                            {verTodasHorasBaseMensal ? '▲ Ver menos' : `▾ Ver todas (${historicoHorasBaseMensal.length})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* % da Meta Semanal */}
              <div className="pt-4 border-t border-hair">
                <button
                  type="button"
                  onClick={() => setOpenBillableSection(openBillableSection === 'metaSemanal' ? null : 'metaSemanal')}
                  className="w-full flex items-center justify-between text-left min-h-[44px] focus:outline-none"
                >
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Meta percentual semanal</h3>
                    <p className="text-xs text-ink-500">Percentual de meta billable semanal a ser atingido.</p>
                  </div>
                  <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 shrink-0 ml-4 transition-transform duration-d5 ${openBillableSection === 'metaSemanal' ? 'rotate-0' : '-rotate-90'}`} />
                </button>
                {openBillableSection === 'metaSemanal' && (
                  <div className="space-y-4 mt-4">
                    {/* Linha 1: Valores e Data */}
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Margem (%)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={margemMinima}
                            onChange={(e) => setMargemMinima(parseFloat(e.target.value) || 0)}
                            className={`${classeCampo()} !w-32 text-center font-mono font-bold text-base min-h-[44px]`}
                          />
                          <span className="text-ink-900 font-bold">%</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          A partir de
                        </label>
                        <input
                          type="date"
                          value={semanaInicioMargem}
                          onChange={(e) => setSemanaInicioMargem(e.target.value)}
                          className={`${classeCampo()} !w-44 font-mono text-sm min-h-[44px]`}
                        />
                        {semanaInicioMargem && (
                          <span className="text-xs text-ink-500">
                            {formatarIntervaloSemana(semanaInicioMargem)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linha 2: Salvar */}
                    <div>
                      <Button
                        variante="primario"
                        tamanho="md"
                        type="button"
                        onClick={handleSalvarMargem}
                        disabled={savingMargem}
                        className="min-h-[44px]"
                      >
                        {savingMargem ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>

                    {/* Histórico */}
                    {historicoMargem.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Histórico
                        </p>
                        <div className="border-l-2 border-dashed border-hair ml-1 pl-3 space-y-2">
                          {(verTodasMargem ? historicoMargem : historicoMargem.slice(0, 3)).map((h, idx) => (
                            <div key={h.id} className="flex items-start gap-2">
                              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-ok' : 'bg-ink-500'}`} />
                              <div>
                                <span className="text-sm text-ink-900 font-semibold">{h.margem_minima}%</span>
                                <span className="text-xs text-ink-500"> — a partir de {formatarData(h.semana_inicio)}</span>
                                <div className="text-xs text-ink-500">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {historicoMargem.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setVerTodasMargem(v => !v)}
                            className="text-xs text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez focus:outline-none py-2 min-h-[44px] inline-flex items-center"
                          >
                            {verTodasMargem ? '▲ Ver menos' : `▾ Ver todas (${historicoMargem.length})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* % da Meta Mensal */}
              <div className="pt-4 border-t border-hair">
                <button
                  type="button"
                  onClick={() => setOpenBillableSection(openBillableSection === 'metaMensal' ? null : 'metaMensal')}
                  className="w-full flex items-center justify-between text-left min-h-[44px] focus:outline-none"
                >
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Meta percentual mensal</h3>
                    <p className="text-xs text-ink-500">Percentual de meta billable mensal a ser atingido.</p>
                  </div>
                  <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 shrink-0 ml-4 transition-transform duration-d5 ${openBillableSection === 'metaMensal' ? 'rotate-0' : '-rotate-90'}`} />
                </button>
                {openBillableSection === 'metaMensal' && (
                  <div className="space-y-4 mt-4">
                    {/* Linha 1: Valores e Data */}
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Margem (%)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min="1"
                            max="100"
                            value={margemMinimaMensal}
                            onChange={(e) => setMargemMinimaMensal(parseFloat(e.target.value) || 0)}
                            className={`${classeCampo()} !w-32 text-center font-mono font-bold text-base min-h-[44px]`}
                          />
                          <span className="text-ink-900 font-bold">%</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          A partir de
                        </label>
                        <input
                          type="month"
                          value={mesInicioMargemMensal}
                          onChange={(e) => setMesInicioMargemMensal(e.target.value)}
                          className={`${classeCampo()} !w-44 font-mono text-sm min-h-[44px]`}
                        />
                      </div>
                    </div>

                    {/* Linha 2: Salvar */}
                    <div>
                      <Button
                        variante="primario"
                        tamanho="md"
                        type="button"
                        onClick={handleSalvarMargemMensal}
                        disabled={savingMargemMensal}
                        className="min-h-[44px]"
                      >
                        {savingMargemMensal ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>

                    {/* Histórico */}
                    {historicoMargemMensal.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Histórico
                        </p>
                        <div className="border-l-2 border-dashed border-hair ml-1 pl-3 space-y-2">
                          {(verTodasMargemMensal ? historicoMargemMensal : historicoMargemMensal.slice(0, 3)).map((h, idx) => (
                            <div key={h.id} className="flex items-start gap-2">
                              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-ok' : 'bg-ink-500'}`} />
                              <div>
                                <span className="text-sm text-ink-900 font-semibold">{h.margem_minima}%</span>
                                <span className="text-xs text-ink-500"> — a partir de {formatarData(h.mes_inicio)}</span>
                                <div className="text-xs text-ink-500">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {historicoMargemMensal.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setVerTodasMargemMensal(v => !v)}
                            className="text-xs text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez focus:outline-none py-2 min-h-[44px] inline-flex items-center"
                          >
                            {verTodasMargemMensal ? '▲ Ver menos' : `▾ Ver todas (${historicoMargemMensal.length})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Saldo Acumulado - Data de Início */}
              <div className="pt-4 border-t border-hair">
                <button
                  type="button"
                  onClick={() => setOpenBillableSection(openBillableSection === 'saldoAcumulado' ? null : 'saldoAcumulado')}
                  className="w-full flex items-center justify-between text-left min-h-[44px] focus:outline-none"
                >
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">SALDO ACUMULADO — DATA DE INÍCIO</h3>
                    <p className="text-xs text-ink-500">O saldo acumulado será calculado a partir da semana selecionada.</p>
                  </div>
                  <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 shrink-0 ml-4 transition-transform duration-d5 ${openBillableSection === 'saldoAcumulado' ? 'rotate-0' : '-rotate-90'}`} />
                </button>
                {openBillableSection === 'saldoAcumulado' && (
                  <div className="space-y-3 mt-4">
                    <div className="flex flex-col gap-1.5 max-w-[200px]">
                      <label htmlFor="saldoInicioSemana" className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                        A partir de
                      </label>
                      <input
                        id="saldoInicioSemana"
                        type="date"
                        value={saldoInicioSemana}
                        onChange={(e) => setSaldoInicioSemana(e.target.value)}
                        className={`${classeCampo()} font-mono text-sm min-h-[44px]`}
                      />
                      {saldoInicioSemana && (
                        <span className="text-xs text-ink-500">
                          {formatarIntervaloSemana(saldoInicioSemana)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Backup de Dados */}
            <div className="bg-surface-1 border border-hair rounded-card p-6 md:p-8 space-y-6 shadow-e1 mt-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">Backup de Dados</h3>
                <p className="text-xs text-ink-500">
                  Exporte todos os seus registros, projetos e configurações para um arquivo Excel (.xlsx).
                </p>
              </div>
              <div>
                <Button
                  variante="primario"
                  tamanho="md"
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  carregando={exporting}
                  iconeEsquerda={<Download className="w-icon-sm h-icon-sm" />}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  {exporting ? 'Exportando...' : 'Exportar para Excel'}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
