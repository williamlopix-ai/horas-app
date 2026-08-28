import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfig } from '../contexts/ConfigContext'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, Eye, Pencil, Trash2, X } from 'lucide-react'
import { Button, Surface, classeCampo } from '../components/ui'
import Sidebar from '../components/Sidebar'
import type { SubcategoriaBreakdownItem } from '../components/BreakdownSubcategorias'
import ModalRegistro from '../components/ModalRegistro'
import MenuAcoes, { type ItemMenu } from '../components/MenuAcoes'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { SkeletonCard } from '../components/Skeleton'
import { listarProjetos, atualizarProjeto } from '../services/projetos'
import { listarRegistros, atualizarRegistro, calcularSemanaInicio } from '../services/registros'
import { subcategoriasService } from '../services/subcategorias'
import { fasesService } from '../services/fases'
import { listarPlanoSemanal, salvarPlanoSemana, excluirPlanoSemana } from '../services/plano_semanal'
import { inicioDaSemana, intervaloDaSemana } from '../utils/semana'
import { getErrorMessage } from '../utils/errors'
import type { Projeto, Registro, Subcategoria, Fase, PlanoSemanal } from '../types'

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

const DESTINO_PENDENTE = '__escolher__'

export default function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { config } = useConfig()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [registros, setRegistros] = useState<RegistroComDetalhes[]>([])
  const [todosRegistros, setTodosRegistros] = useState<RegistroComDetalhes[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [fases, setFases] = useState<Fase[]>([])

  // Estados do Plano Semanal
  const [planosSemanais, setPlanosSemanais] = useState<PlanoSemanal[]>([])
  const [semanaInputDate, setSemanaInputDate] = useState<string>('')
  const [horasPlanejadasInput, setHorasPlanejadasInput] = useState<string>('')
  const [salvandoPlano, setSalvandoPlano] = useState(false)
  const [planoExcluindo, setPlanoExcluindo] = useState<PlanoSemanal | null>(null)

  const [fasesExpandidas, setFasesExpandidas] = useState<Record<string, boolean>>({})
  const [secoesExpandidas, setSecoesExpandidas] = useState<Record<string, boolean>>({})
  const [avisoNovoProjeto, setAvisoNovoProjeto] = useState(false)
  const [pulsoAtivo, setPulsoAtivo] = useState(false)

  const toggleSecao = (chave: string) => {
    setSecoesExpandidas(prev => ({ ...prev, [chave]: !prev[chave] }))
  }

  // Estados de gestão de Fases na página
  const [editandoFaseId, setEditandoFaseId] = useState<string | null>(null)
  const [nomeFaseEditando, setNomeFaseEditando] = useState('')
  const [horasFaseEditando, setHorasFaseEditando] = useState('')
  const [faseExcluindoId, setFaseExcluindoId] = useState<string | null>(null)
  const [faseComSubsExcluindo, setFaseComSubsExcluindo] = useState<{ faseId: string; destinoFaseId: string } | null>(null)
  const [confirmandoRemoverDivisao, setConfirmandoRemoverDivisao] = useState(false)
  const [salvandoFase, setSalvandoFase] = useState(false)
  const [salvandoContratadas, setSalvandoContratadas] = useState(false)
  const [editandoContratadas, setEditandoContratadas] = useState(false)
  const [valorContratadasEditando, setValorContratadasEditando] = useState('')

  // Estados de gestão de Subcategorias na página
  const [editandoSubId, setEditandoSubId] = useState<string | null>(null)
  const [nomeSubEditando, setNomeSubEditando] = useState('')
  const [editandoReservaId, setEditandoReservaId] = useState<string | null>(null)
  const [valorReservaEditando, setValorReservaEditando] = useState('')
  const [subExcluindoId, setSubExcluindoId] = useState<string | null>(null)
  const [adicionandoEmFaseId, setAdicionandoEmFaseId] = useState<string | null>(null)
  const [novaSubNome, setNovaSubNome] = useState('')
  const [adicionandoSemFase, setAdicionandoSemFase] = useState(false)
  const [salvandoSub, setSalvandoSub] = useState(false)
  const [baldeExpandido, setBaldeExpandido] = useState(false)
  const [subsExpandidas, setSubsExpandidas] = useState<Record<string, boolean>>({})
  const toggleSub = (subId: string) => {
    setSubsExpandidas(prev => ({ ...prev, [subId]: !prev[subId] }))
  }

  // Estados da seção Lançamentos / Modal de Registro
  const [isModalRegistroOpen, setIsModalRegistroOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<RegistroComDetalhes | null>(null)
  const [semanasExpandidas, setSemanasExpandidas] = useState<Record<string, boolean>>({})

  const carregarDados = async (silencioso = false) => {
    if (!user || !id) return
    try {
      if (!silencioso) setLoading(true)
      setError(null)

      const [projs, todosRegs, subs, fas, planos] = await Promise.all([
        listarProjetos(user.id),
        listarRegistros(user.id),
        subcategoriasService.listarSubcategorias(id),
        fasesService.listarFases(id),
        listarPlanoSemanal(user.id, id)
      ])

      const regsDoProjeto = todosRegs.filter(r => r.projeto_id === id)
      const projEncontrado = projs.find(p => p.id === id) || null

      setProjeto(projEncontrado)
      setTodosRegistros(todosRegs)
      setRegistros(regsDoProjeto)
      setSubcategorias(subs)
      setFases(fas)
      setPlanosSemanais(planos)

      const expandidasMap: Record<string, boolean> = {}
      fas.forEach(f => {
        expandidasMap[f.id] = false
      })
      setFasesExpandidas(expandidasMap)

    } catch (err: unknown) {
      console.error('Erro ao carregar detalhes do projeto:', err)
      setError(getErrorMessage(err))
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user, id])

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setAvisoNovoProjeto(true)
      setPulsoAtivo(true)
      const proximos = new URLSearchParams(searchParams)
      proximos.delete('novo')
      setSearchParams(proximos, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pulsoAtivo) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let iniciado = false

    const iniciarContagem = () => {
      if (iniciado) return
      iniciado = true
      timeoutId = setTimeout(() => {
        setPulsoAtivo(false)
      }, 6000)
    }

    window.addEventListener('mousemove', iniciarContagem, { once: true })
    window.addEventListener('keydown', iniciarContagem, { once: true })
    window.addEventListener('touchstart', iniciarContagem, { once: true })

    return () => {
      window.removeEventListener('mousemove', iniciarContagem)
      window.removeEventListener('keydown', iniciarContagem)
      window.removeEventListener('touchstart', iniciarContagem)
      clearTimeout(timeoutId)
    }
  }, [pulsoAtivo])

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

  const toggleSemana = (semanaKey: string) => {
    setSemanasExpandidas(prev => ({ ...prev, [semanaKey]: !prev[semanaKey] }))
  }

  const registrosPorSemana = useMemo(() => {
    const grupos: Record<string, typeof registros> = {}
    registros.forEach(r => {
      const sem = r.semana_inicio || calcularSemanaInicio(r.data, config.inicio_semana)
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
  }, [registros, config.inicio_semana])

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
      await atualizarRegistro(editingRegistro.id, dados, config.inicio_semana)
      await carregarDados(true)
      fecharModalRegistro()
      showToast('Registro salvo!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao salvar registro:', err)
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleDividirEmFases = async () => {
    if (!user || !projeto) return
    try {
      setSalvandoFase(true)
      const h1 = projeto.horas_contratadas
      const f1 = await fasesService.criarFase(user.id, projeto.id, 'Fase 1', 1, h1)
      const f2 = await fasesService.criarFase(user.id, projeto.id, 'Fase 2', 2, null)

      await subcategoriasService.atribuirFaseEmLote(projeto.id, f1.id)

      await carregarDados(true)
      setEditandoFaseId(f2.id)
      setNomeFaseEditando(f2.nome)
      setHorasFaseEditando('')
    } catch (err: unknown) {
      console.error('Erro ao dividir em fases:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleAddFase = async () => {
    if (!user || !projeto) return
    try {
      setSalvandoFase(true)
      const novaOrdem = fases.length > 0 ? Math.max(...fases.map(f => f.ordem)) + 1 : 1
      const novoNome = `Fase ${novaOrdem}`
      const novaFase = await fasesService.criarFase(user.id, projeto.id, novoNome, novaOrdem, null)
      await carregarDados(true)
      setEditandoFaseId(novaFase.id)
      setNomeFaseEditando(novaFase.nome)
      setHorasFaseEditando('')
    } catch (err: unknown) {
      console.error('Erro ao adicionar fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleStartEditFase = (fase: Fase) => {
    setEditandoFaseId(fase.id)
    setNomeFaseEditando(fase.nome)
    setHorasFaseEditando(fase.horas_contratadas !== null && fase.horas_contratadas !== undefined ? fase.horas_contratadas.toString() : '')
  }

  const handleCancelEditFase = () => {
    setEditandoFaseId(null)
    setNomeFaseEditando('')
    setHorasFaseEditando('')
  }

  const handleSaveEditFase = async (faseId: string) => {
    if (!nomeFaseEditando.trim()) return
    try {
      setSalvandoFase(true)
      let horasParsed: number | null = null
      if (horasFaseEditando.trim()) {
        const val = parseFloat(horasFaseEditando.replace(',', '.'))
        if (!isNaN(val)) horasParsed = val
      }
      await fasesService.atualizarFase(faseId, {
        nome: nomeFaseEditando.trim(),
        horas_contratadas: horasParsed
      })
      await carregarDados(true)
      setEditandoFaseId(null)
      setNomeFaseEditando('')
      setHorasFaseEditando('')
    } catch (err: unknown) {
      console.error('Erro ao atualizar fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  useEffect(() => {
    if (!faseComSubsExcluindo || salvandoFase) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFaseComSubsExcluindo(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [faseComSubsExcluindo, salvandoFase])

  const handleClicarExcluirFase = (fase: Fase) => {
    const subsDaFase = subcategorias.filter(s => s.fase_id === fase.id)
    if (subsDaFase.length === 0) {
      setFaseExcluindoId(fase.id)
    } else {
      const outrasFases = fases
        .filter(f => f.id !== fase.id)
        .sort((a, b) => a.ordem - b.ordem)

      const padraoDestino = outrasFases.length > 0 ? DESTINO_PENDENTE : ''
      setFaseComSubsExcluindo({ faseId: fase.id, destinoFaseId: padraoDestino })
    }
  }

  const handleConfirmarExclusaoFaseComSubs = async (faseId: string, destinoFaseIdRaw: string) => {
    if (destinoFaseIdRaw === DESTINO_PENDENTE) return
    try {
      setSalvandoFase(true)
      const destinoFaseId = destinoFaseIdRaw.trim() !== '' ? destinoFaseIdRaw : null
      const subsDaFase = subcategorias.filter(s => s.fase_id === faseId)

      if (subsDaFase.length > 0) {
        await Promise.all(
          subsDaFase.map(sub =>
            subcategoriasService.atualizarSubcategoria(sub.id, sub.nome, undefined, destinoFaseId)
          )
        )
      }

      await fasesService.excluirFase(faseId)
      setFaseComSubsExcluindo(null)
      await carregarDados(true)
    } catch (err: unknown) {
      console.error('Erro ao excluir fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleConfirmarExclusaoFase = async () => {
    if (!faseExcluindoId) return
    try {
      setSalvandoFase(true)
      await fasesService.excluirFase(faseExcluindoId)
      setFaseExcluindoId(null)
      await carregarDados(true)
    } catch (err: unknown) {
      console.error('Erro ao excluir fase:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleConfirmarRemoverDivisao = async () => {
    if (!projeto) return
    try {
      setSalvandoFase(true)
      await subcategoriasService.atribuirFaseEmLote(projeto.id, null)
      await Promise.all(fases.map(f => fasesService.excluirFase(f.id)))
      setConfirmandoRemoverDivisao(false)
      await carregarDados(true)
    } catch (err: unknown) {
      console.error('Erro ao remover divisão em fases:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoFase(false)
    }
  }

  const handleAtualizarContratadasParaFases = async () => {
    if (!projeto) return
    try {
      setSalvandoContratadas(true)
      await atualizarProjeto(projeto.id, { horas_contratadas: somaPrevistasFases })
      await carregarDados(true)
      showToast('Horas contratadas atualizadas!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao atualizar horas contratadas:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoContratadas(false)
    }
  }

  const handleStartEditContratadas = () => {
    if (!projeto) return
    setEditandoContratadas(true)
    setValorContratadasEditando(
      projeto.horas_contratadas !== null && projeto.horas_contratadas !== undefined
        ? (Number.isInteger(projeto.horas_contratadas)
            ? projeto.horas_contratadas.toString()
            : projeto.horas_contratadas.toString().replace('.', ','))
        : ''
    )
  }

  const handleCancelEditContratadas = () => {
    setEditandoContratadas(false)
    setValorContratadasEditando('')
  }

  const handleSaveEditContratadas = async () => {
    if (!projeto) return
    let valor: number | null = null
    const raw = valorContratadasEditando.trim()
    if (raw) {
      const parsed = parseFloat(raw.replace(',', '.'))
      if (isNaN(parsed) || parsed < 0) {
        showToast('Valor de horas inválido', 'error')
        return
      }
      valor = parsed
    }
    try {
      setSalvandoContratadas(true)
      await atualizarProjeto(projeto.id, { horas_contratadas: valor })
      await carregarDados(true)
      handleCancelEditContratadas()
    } catch (err: unknown) {
      console.error('Erro ao salvar horas contratadas:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoContratadas(false)
    }
  }

  // Handlers para Subcategorias
  const formatarHoras = (val: number) => {
    const rounded = Math.round(val * 100) / 100
    return rounded.toString().replace('.', ',')
  }

  const handleStartEditSub = (sub: SubcategoriaBreakdownItem) => {
    if (!sub.id) return
    handleCancelEditReserva()
    setEditandoSubId(sub.id)
    setNomeSubEditando(sub.nome)
  }

  const handleCancelEditSub = () => {
    setEditandoSubId(null)
    setNomeSubEditando('')
  }

  const handleStartEditReserva = (sub: SubcategoriaBreakdownItem) => {
    if (!sub.id) return
    handleCancelEditSub()
    setEditandoReservaId(sub.id)
    setValorReservaEditando(
      sub.horas_alocadas !== null && sub.horas_alocadas !== undefined
        ? (Number.isInteger(sub.horas_alocadas)
            ? sub.horas_alocadas.toString()
            : sub.horas_alocadas.toString().replace('.', ','))
        : ''
    )
  }

  const handleCancelEditReserva = () => {
    setEditandoReservaId(null)
    setValorReservaEditando('')
  }

  const handleSaveEditReserva = async (subId: string, nome: string) => {
    let valor: number | null = null
    const raw = valorReservaEditando.trim()
    if (raw) {
      const parsed = parseFloat(raw.replace(',', '.'))
      if (isNaN(parsed) || parsed < 0) {
        showToast('Valor de horas inválido', 'error')
        return
      }
      valor = parsed
    }
    try {
      setSalvandoSub(true)
      await subcategoriasService.atualizarSubcategoria(subId, nome, valor, undefined)
      await carregarDados(true)
      handleCancelEditReserva()
    } catch (err: unknown) {
      console.error('Erro ao salvar reserva:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleSaveEditSub = async (subId: string) => {
    if (!nomeSubEditando.trim()) return
    try {
      setSalvandoSub(true)
      await subcategoriasService.atualizarSubcategoria(subId, nomeSubEditando.trim())
      await carregarDados(true)
      handleCancelEditSub()
      showToast('Subcategoria salva!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao salvar subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleConfirmarExclusaoSub = async () => {
    if (!subExcluindoId) return
    try {
      setSalvandoSub(true)
      await subcategoriasService.excluirSubcategoria(subExcluindoId)
      setSubExcluindoId(null)
      await carregarDados(true)
      showToast('Subcategoria excluída!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao excluir subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleMoverSubcategoria = async (
    subId: string,
    nome: string,
    novaFaseId: string | null
  ) => {
    try {
      setSalvandoSub(true)
      await subcategoriasService.atualizarSubcategoria(subId, nome, undefined, novaFaseId)
      await carregarDados(true)
      showToast('Subcategoria movida com sucesso!', 'success')

      if (novaFaseId && id) {
        const [novasSubs, novasFases] = await Promise.all([
          subcategoriasService.listarSubcategorias(id),
          fasesService.listarFases(id)
        ])
        const faseDestino = novasFases.find(f => f.id === novaFaseId)
        if (faseDestino && faseDestino.horas_contratadas !== null && faseDestino.horas_contratadas !== undefined && faseDestino.horas_contratadas > 0) {
          const subsFaseDestino = novasSubs.filter(s => s.fase_id === novaFaseId)
          const somaAlocadas = subsFaseDestino.reduce((acc, s) => acc + (s.horas_alocadas || 0), 0)
          const diff = Math.round((somaAlocadas - faseDestino.horas_contratadas) * 100) / 100
          if (diff > 0) {
            showToast(`Fase ${faseDestino.nome} ficou ${formatarHoras(diff)}h acima das horas previstas`, 'error')
          }
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao mover subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const handleConfirmAddSubcategoria = async (faseId: string | null) => {
    if (!novaSubNome.trim() || !user || !projeto) return
    try {
      setSalvandoSub(true)
      await subcategoriasService.criarSubcategoria(user.id, projeto.id, novaSubNome.trim(), faseId)
      await carregarDados(true)
      setNovaSubNome('')
      setAdicionandoEmFaseId(null)
      setAdicionandoSemFase(false)
      showToast('Subcategoria criada!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao criar subcategoria:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoSub(false)
    }
  }

  const renderListaSubcategorias = (items: SubcategoriaBreakdownItem[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-xs text-ink-500 italic py-2">
          Nenhuma subcategoria cadastrada.
        </div>
      )
    }

    const temAlgumaAlocacao = items.some(sub => {
      if (sub.id === null) return false
      return sub.horas_alocadas !== null && sub.horas_alocadas > 0
    })

    const somaSemAlocacao = items.reduce((acc, sub) => {
      let temAloc = false
      if (sub.id !== null) {
        temAloc = sub.horas_alocadas !== null && sub.horas_alocadas > 0
      }
      if (!temAloc) {
        return acc + sub.duracao
      }
      return acc
    }, 0)

    const exibirRodape = temAlgumaAlocacao && somaSemAlocacao > 0

    return (
      <div className="bg-surface-1 rounded-card p-4 border border-hair space-y-3">
        <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block font-mono">Subcategorias</span>
        <div className="space-y-2.5">
          {items.map((sub) => {
            const isBaldeSemSub = sub.id === null
            const temAlocacao = !isBaldeSemSub && sub.horas_alocadas !== null && sub.horas_alocadas > 0
            const excedeu = temAlocacao && sub.duracao > sub.horas_alocadas!
            const percentualAlocado = temAlocacao ? Math.round((sub.duracao / sub.horas_alocadas!) * 100) : 0
            const larguraBarra = temAlocacao ? Math.min(100, Math.max(0, (sub.duracao / sub.horas_alocadas!) * 100)) : 0

            const duracaoFormatada = `${sub.duracao.toFixed(2).replace('.', ',')}h`
            const alocadoFormatado = temAlocacao
              ? (Number.isInteger(sub.horas_alocadas)
                  ? `${sub.horas_alocadas}h`
                  : `${sub.horas_alocadas!.toString().replace('.', ',')}h`)
              : ''

            const isEditingThisSub = !isBaldeSemSub && editandoSubId === sub.id
            const isEditingReserva = !isBaldeSemSub && editandoReservaId === sub.id

            if (isBaldeSemSub) {
              const orfaos = registros
                .filter(r => !r.subcategoria_id)
                .sort((a, b) => a.data.localeCompare(b.data))

              return (
                <div key="sem_sub" className="space-y-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => setBaldeExpandido(v => !v)}
                    className="w-full flex justify-between items-center text-xs gap-2 text-left focus:outline-none group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <ChevronDown
                        className={`w-icon-sm h-icon-sm text-ink-500 shrink-0 transition-transform duration-d2 ease-ez ${baldeExpandido ? 'rotate-180' : ''}`}
                      />
                      <span className="text-ink-900 whitespace-normal break-words" title={sub.nome}>{sub.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="font-mono text-right shrink-0">
                        <span className="font-bold text-ink-900">{duracaoFormatada}</span>
                      </div>
                      <span className="font-mono w-10 text-right font-medium text-ink-500 shrink-0">
                        {sub.percentual ?? 0}%
                      </span>
                    </div>
                  </button>

                  {baldeExpandido && orfaos.length > 0 && (
                    <div className="mt-2 ml-4 pl-3 border-l border-hair space-y-1">
                      <p className="text-xs text-ink-500 mb-1">Clique em um lançamento para atribuir uma categoria.</p>
                      {orfaos.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => abrirEditarRegistro(r)}
                          className="w-full flex items-center justify-between gap-3 text-xs py-3 px-2 min-h-[44px] rounded-ctl hover:bg-surface-2 transition-colors text-left focus:outline-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="font-mono text-ink-500 shrink-0">{formatarDataCurta(r.data)}</span>
                            <span className="text-ink-700 font-mono shrink-0">{r.hora_inicio.slice(0, 5)}–{r.hora_fim.slice(0, 5)}</span>
                            {r.observacao ? (
                              <span className="text-ink-900 truncate" title={r.observacao}>{r.observacao}</span>
                            ) : (
                              <span className="text-ink-300 italic">sem observação</span>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-ink-900 shrink-0">
                            {r.duracao.toFixed(2).replace('.', ',')}h
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            const temLancamento = registros.some(r => r.subcategoria_id === sub.id)
            const diasAgrupados = registros
              .filter(r => r.subcategoria_id === sub.id)
              .reduce<{ data: string; total: number }[]>((acc, r) => {
                const existente = acc.find(d => d.data === r.data)
                if (existente) {
                  existente.total += r.duracao
                } else {
                  acc.push({ data: r.data, total: r.duracao })
                }
                return acc
              }, [])
              .sort((a, b) => b.data.localeCompare(a.data))

            if (isEditingThisSub) {
              return (
                <div key={sub.id} className="flex items-center gap-2 w-full py-1">
                  <input
                    type="text"
                    value={nomeSubEditando}
                    onChange={(e) => setNomeSubEditando(e.target.value)}
                    placeholder="Nome da subcategoria"
                    disabled={salvandoSub}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveEditSub(sub.id!)
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        handleCancelEditSub()
                      }
                    }}
                    className={`${classeCampo()} !flex-1 !w-auto min-w-0 text-xs py-1 px-2.5`}
                    autoFocus
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveEditSub(sub.id!)}
                      disabled={!nomeSubEditando.trim() || salvandoSub}
                      className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 text-ok hover:text-ink-900 disabled:opacity-50 transition-colors"
                      title="Confirmar"
                    >
                      <Check className="w-icon-sm h-icon-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditSub}
                      disabled={salvandoSub}
                      className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 text-ink-500 hover:text-ink-900 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-icon-sm h-icon-sm" />
                    </button>
                  </div>
                </div>
              )
            }

            const subOriginal = subcategorias.find(s => s.id === sub.id)
            const faseAtualId = subOriginal?.fase_id ?? null

            const itensMenu: ItemMenu[] = [
              {
                label: 'Renomear',
                onClick: () => handleStartEditSub(sub)
              },
              {
                label: 'Reservar horas',
                onClick: () => handleStartEditReserva(sub)
              }
            ]

            if (fases.length > 0) {
              itensMenu.push({
                label: 'MOVER PARA',
                onClick: () => {},
                desabilitado: true,
                separadorAntes: true
              })

              fases
                .filter(f => f.id !== faseAtualId)
                .forEach(f => {
                  itensMenu.push({
                    label: f.nome,
                    onClick: () => handleMoverSubcategoria(sub.id!, sub.nome, f.id)
                  })
                })

              if (faseAtualId !== null) {
                itensMenu.push({
                  label: 'Sem fase',
                  onClick: () => handleMoverSubcategoria(sub.id!, sub.nome, null)
                })
              }
            }

            itensMenu.push({
              label: 'Excluir',
              onClick: () => setSubExcluindoId(sub.id),
              perigo: true,
              separadorAntes: true
            })

            return (
              <div key={sub.id || 'sem_sub'} className="space-y-1 py-0.5">
                <div className="flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    {temLancamento && !isEditingReserva ? (
                      <button
                        type="button"
                        onClick={() => toggleSub(sub.id!)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 focus:outline-none -my-2 -ml-2"
                      >
                        <ChevronDown
                          className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d2 ease-ez ${subsExpandidas[sub.id!] ? 'rotate-180' : ''}`}
                        />
                      </button>
                    ) : (
                      <span className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 -my-2 -ml-2" />
                    )}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBaldeSemSub ? 'border border-ink-500 bg-transparent' : 'bg-accent'}`} />
                    <span className="text-ink-900 whitespace-normal break-words" title={sub.nome}>{sub.nome}</span>
                    {temAlgumaAlocacao && !temAlocacao && !isBaldeSemSub && !isEditingReserva && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-2 border border-hair-strong text-ink-500 shrink-0 font-medium font-mono">
                        sem reserva
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditingReserva ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="text"
                          value={valorReservaEditando}
                          onChange={(e) => setValorReservaEditando(e.target.value)}
                          placeholder="Horas"
                          disabled={salvandoSub}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveEditReserva(sub.id!, sub.nome)
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              handleCancelEditReserva()
                            }
                          }}
                          className={`${classeCampo()} !w-24 text-xs py-1 px-2.5 font-mono`}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditReserva(sub.id!, sub.nome)}
                          disabled={salvandoSub}
                          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 text-ok hover:text-ink-900 disabled:opacity-50 transition-colors"
                          title="Confirmar"
                        >
                          <Check className="w-icon-sm h-icon-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditReserva}
                          disabled={salvandoSub}
                          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 text-ink-500 hover:text-ink-900 transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-icon-sm h-icon-sm" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-mono text-right shrink-0">
                          <span className="font-bold text-ink-900">{duracaoFormatada}</span>
                          {temAlocacao && (
                            <span className="text-xs text-ink-500"> de {alocadoFormatado} reservadas</span>
                          )}
                        </div>
                        <span className="font-mono w-10 text-right font-medium text-ink-500 shrink-0">
                          {!temAlocacao ? `${sub.percentual ?? 0}%` : ''}
                        </span>
                        {!isBaldeSemSub && (
                          <div className="shrink-0 ml-1">
                            <MenuAcoes
                              itens={itensMenu}
                              rotulo={`Ações para ${sub.nome}`}
                              desabilitado={salvandoSub || editandoSubId !== null || editandoReservaId !== null}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {temAlocacao && !isEditingReserva && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-surface-2 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-d3 ease-ez ${excedeu ? 'bg-bad' : 'bg-accent'}`}
                        style={{
                          width: `${larguraBarra}%`
                        }}
                      />
                    </div>
                    <span
                      className={`font-mono text-[10px] w-10 text-right font-medium shrink-0 ${excedeu ? 'text-bad' : 'text-ink-500'}`}
                    >
                      {percentualAlocado}%
                    </span>
                  </div>
                )}

                {subsExpandidas[sub.id!] && temLancamento && (
                  <div className="mt-2 ml-4 pl-3 border-l border-hair space-y-1">
                    {diasAgrupados.map(dia => (
                      <button
                        key={dia.data}
                        type="button"
                        onClick={() => navigate(`/registros?data=${dia.data}&subcategoria_id=${sub.id}`)}
                        className="w-full flex items-center justify-between gap-3 text-xs py-3 px-2 min-h-[44px] rounded-ctl hover:bg-surface-2 transition-colors text-left focus:outline-none"
                      >
                        <span className="font-mono text-ink-500">{formatarDataCurta(dia.data)}</span>
                        <span className="font-mono font-semibold text-ink-900">{dia.total.toFixed(2).replace('.', ',')}h</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {exibirRodape && (
          <div className="mt-3 pt-2 border-t border-hair text-[10px] text-ink-500 text-right font-mono">
            {somaSemAlocacao.toFixed(2).replace('.', ',')}h lançadas fora de reserva
          </div>
        )}
      </div>
    )
  }

  // Auxiliares do Plano Semanal
  const formatarIntervaloCurto = (inicio: Date, fim: Date) => {
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
    const d1 = String(inicio.getDate()).padStart(2, '0')
    const m1 = String(inicio.getMonth() + 1).padStart(2, '0')
    const ds1 = dias[inicio.getDay()]

    const d2 = String(fim.getDate()).padStart(2, '0')
    const m2 = String(fim.getMonth() + 1).padStart(2, '0')
    const ds2 = dias[fim.getDay()]

    return `${ds1} ${d1}/${m1} a ${ds2} ${d2}/${m2}`
  }

  const semanaInicioCalculada = useMemo(() => {
    if (!semanaInputDate) return ''
    return inicioDaSemana(semanaInputDate, config.inicio_semana)
  }, [semanaInputDate, config.inicio_semana])

  const planoExistente = useMemo(() => {
    if (!semanaInicioCalculada) return null
    return planosSemanais.find(p => p.semana_inicio === semanaInicioCalculada) || null
  }, [semanaInicioCalculada, planosSemanais])

  const handleSalvarPlanoSemanal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !semanaInputDate) return
    const val = parseFloat(horasPlanejadasInput.replace(',', '.'))
    if (isNaN(val) || val < 0) return

    try {
      setSalvandoPlano(true)
      await salvarPlanoSemana({
        usuarioId: user.id,
        projetoId: id,
        semanaInicio: semanaInicioCalculada,
        horasPlanejadas: val
      })
      await carregarDados(true)
      setSemanaInputDate('')
      setHorasPlanejadasInput('')
      showToast('Plano semanal salvo!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao salvar plano semanal:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoPlano(false)
    }
  }

  const handleConfirmarExclusaoPlano = async () => {
    if (!planoExcluindo) return
    try {
      setSalvandoPlano(true)
      await excluirPlanoSemana(planoExcluindo.id)
      setPlanoExcluindo(null)
      await carregarDados(true)
      showToast('Plano semanal excluído!', 'success')
    } catch (err: unknown) {
      console.error('Erro ao excluir plano semanal:', err)
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSalvandoPlano(false)
    }
  }

  const handleSelecionarPlanoParaEdicao = (plano: PlanoSemanal) => {
    setSemanaInputDate(plano.semana_inicio)
    setHorasPlanejadasInput(plano.horas_planejadas.toString())
  }

  const totalPlanejado = useMemo(() => {
    return planosSemanais.reduce((acc, p) => acc + p.horas_planejadas, 0)
  }, [planosSemanais])

  const planosOrdenados = useMemo(() => {
    return [...planosSemanais].sort((a, b) => a.semana_inicio.localeCompare(b.semana_inicio))
  }, [planosSemanais])

  const planosComMetricas = useMemo(() => {
    return planosOrdenados.map(plano => {
      const realizado = registros
        .filter(r => (r.semana_inicio || calcularSemanaInicio(r.data, config.inicio_semana)) === plano.semana_inicio)
        .reduce((acc, r) => acc + r.duracao, 0)
      const diferenca = realizado - plano.horas_planejadas
      return {
        ...plano,
        realizado,
        diferenca
      }
    })
  }, [planosOrdenados, registros, config.inicio_semana])

  const totalRealizadoPlanos = useMemo(() => {
    return planosComMetricas.reduce((acc, p) => acc + p.realizado, 0)
  }, [planosComMetricas])

  const totalDiferencaPlanos = totalRealizadoPlanos - totalPlanejado

  const totalLancado = registros.reduce((acc, r) => acc + r.duracao, 0)
  const totalContratado = projeto?.horas_contratadas ?? null

  const somaPrevistasFases = fases.reduce((acc, f) => acc + (f.horas_contratadas || 0), 0)
  const fasesExcedemContratado = totalContratado !== null && totalContratado > 0
    ? somaPrevistasFases > totalContratado
    : somaPrevistasFases > 0

  const temContratado = totalContratado !== null && totalContratado > 0
  const percentualGeral = temContratado ? Math.min(100, Math.round((totalLancado / totalContratado!) * 100)) : 0
  const excedeuContratado = temContratado && totalLancado > totalContratado!
  const diffContratado = temContratado ? Math.abs(totalContratado! - totalLancado) : 0
  const dataMaxima = registros.reduce((max, r) => (r.data > max ? r.data : max), '')
  const ultimaAtividade = dataMaxima ? formatarDataCurta(dataMaxima) : '—'

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg rounded-ctl py-2.5 px-3 min-h-[44px]"
          >
            <ArrowLeft className="w-icon-sm h-icon-sm shrink-0" />
            <span>Voltar</span>
          </button>
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
          <div className="space-y-6">
            <SkeletonCard />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : !projeto ? (
          <Surface elevacao={1} comBorda padding="nenhum" className="p-12 text-center max-w-lg mx-auto space-y-4">
            <h3 className="text-lg font-bold text-ink-900 font-display">Projeto não encontrado</h3>
            <Button
              variante="secundario"
              onClick={() => navigate(-1)}
            >
              Voltar à página anterior
            </Button>
          </Surface>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-d3">
            {avisoNovoProjeto && !temContratado && (
              <div className={`rounded-ctl px-3 py-1.5 text-xs border-l-[3px] border-l-accent bg-accent-bg text-accent flex items-center gap-2 font-ui ${pulsoAtivo ? 'pulso-brilho' : ''}`}>
                <span>Projeto criado. Defina as horas contratadas para acompanhar o progresso.</span>
              </div>
            )}
            <Surface elevacao={1} comBorda padding="lg" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full shrink-0 shadow-e1 flex items-center justify-center" style={{ backgroundColor: projeto.cor }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40"></span>
                  </span>
                  <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight uppercase whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis">{projeto.nome}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    style={
                      projeto.status === 'ativo'
                        ? { borderColor: 'color-mix(in srgb, var(--ok) 30%, transparent)' }
                        : projeto.status === 'encerrado'
                        ? { borderColor: 'color-mix(in srgb, var(--warn) 30%, transparent)' }
                        : undefined
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 font-ui ${
                      projeto.status === 'ativo'
                        ? 'bg-ok-bg text-ok'
                        : projeto.status === 'encerrado'
                        ? 'bg-warn-bg text-warn'
                        : 'bg-surface-3 text-ink-500 border-hair'
                    }`}
                  >
                    {projeto.status === 'ativo' ? 'Ativo' : projeto.status === 'encerrado' ? 'Encerrado' : 'Excluído'}
                  </span>
                  <span
                    className={`inline-flex items-center ${pulsoAtivo ? 'pulso-zoom' : ''}`}
                    onClickCapture={() => setPulsoAtivo(false)}
                  >
                    <MenuAcoes
                      itens={[
                        {
                          label: 'Editar horas contratadas',
                          onClick: handleStartEditContratadas
                        }
                      ]}
                      rotulo="Ações do projeto"
                      desabilitado={editandoContratadas || salvandoContratadas}
                    />
                  </span>
                </div>
              </div>
              {projeto.codigo_externo && (
                <div className="font-mono text-xs text-ink-500">
                  Código externo: <span className="text-ink-900 font-semibold">{projeto.codigo_externo}</span>
                </div>
              )}
            </Surface>

            <Surface elevacao={1} comBorda padding="lg" className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium font-ui">
                {editandoContratadas ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={valorContratadasEditando}
                      onChange={(e) => setValorContratadasEditando(e.target.value)}
                      placeholder="Horas"
                      disabled={salvandoContratadas}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSaveEditContratadas()
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          handleCancelEditContratadas()
                        }
                      }}
                      className={`${classeCampo()} !w-28 text-sm py-1 px-2.5 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={handleSaveEditContratadas}
                      disabled={salvandoContratadas}
                      className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 text-ok hover:text-ink-900 disabled:opacity-50 transition-colors"
                      title="Confirmar"
                    >
                      <Check className="w-icon-sm h-icon-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditContratadas}
                      disabled={salvandoContratadas}
                      className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 text-ink-500 hover:text-ink-900 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-icon-sm h-icon-sm" />
                    </button>
                  </div>
                ) : temContratado ? (
                  <button
                    type="button"
                    onClick={handleStartEditContratadas}
                    className="text-ink-500 hover:text-ink-900 text-sm text-left transition-colors"
                  >
                    <span className="text-ink-900 font-bold">{totalLancado.toFixed(2).replace('.', ',')}h</span> lançadas de {totalContratado!.toFixed(2).replace('.', ',')}h contratadas
                  </button>
                ) : (
                  <p className="text-ink-500 flex items-center gap-1.5">
                    <span className="text-ink-900 font-bold">{totalLancado.toFixed(2).replace('.', ',')}h</span> lançadas
                    <button
                      type="button"
                      onClick={() => {
                        handleStartEditContratadas()
                        setPulsoAtivo(false)
                      }}
                      className="text-ink-500 hover:text-ink-900 text-sm transition-colors py-2 px-2.5 min-h-[44px] inline-flex items-center"
                    >
                      definir horas contratadas
                    </button>
                  </p>
                )}
                {temContratado && (
                  <span className="font-mono font-bold text-sm" style={{ color: excedeuContratado ? 'var(--bad)' : 'var(--ok)' }}>
                    {percentualGeral}%
                  </span>
                )}
              </div>
              {temContratado && (
                <div className="w-full bg-surface-0 h-[6px] rounded-full overflow-hidden border border-hair">
                  <div
                    className="h-full transition-all duration-d4"
                    style={{
                      width: `${percentualGeral}%`,
                      backgroundColor: excedeuContratado ? 'var(--bad)' : 'var(--ok)'
                    }}
                  />
                </div>
              )}
              {fasesExcedemContratado && (
                <div className="rounded-ctl px-3 py-1.5 text-xs border-l-[3px] border-l-bad bg-bad-bg text-bad flex items-center justify-between gap-2 font-ui">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-icon-xs h-icon-xs shrink-0 text-bad" />
                    {temContratado ? (
                      <span>as fases somam {somaPrevistasFases.toFixed(2).replace('.', ',')}h previstas, acima das {totalContratado!.toFixed(2).replace('.', ',')}h contratadas</span>
                    ) : (
                      <span>as fases somam {somaPrevistasFases.toFixed(2).replace('.', ',')}h previstas e o projeto não tem horas contratadas</span>
                    )}
                  </span>
                  <Button
                    variante="secundario"
                    tamanho="sm"
                    onClick={handleAtualizarContratadasParaFases}
                    disabled={salvandoContratadas}
                    className="shrink-0 min-h-[44px]"
                  >
                    Atualizar para {somaPrevistasFases.toFixed(2).replace('.', ',')}h
                  </Button>
                </div>
              )}
            </Surface>

            <div className={`grid grid-cols-1 ${temContratado ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-6`}>
              {temContratado && (
                <Surface elevacao={1} comBorda padding="nenhum" className="p-5 space-y-1">
                  <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block font-ui">Restantes</span>
                  <p className="text-xl font-mono font-bold" style={{ color: excedeuContratado ? 'var(--bad)' : 'var(--ok)' }}>
                    {diffContratado.toFixed(2).replace('.', ',')}h {excedeuContratado ? 'acima' : 'restantes'}
                  </p>
                </Surface>
              )}
              <Surface elevacao={1} comBorda padding="nenhum" className="p-5 space-y-1">
                <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block font-ui">Lançamentos</span>
                <p className="text-xl font-mono font-bold text-ink-900">{registros.length} {registros.length === 1 ? 'registro' : 'registros'}</p>
              </Surface>
              <Surface elevacao={1} comBorda padding="nenhum" className="p-5 space-y-1">
                <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block font-ui">Última atividade</span>
                <p className="text-xl font-mono font-bold text-ink-900">{ultimaAtividade}</p>
              </Surface>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSecao('fases')}
                  className="flex items-center gap-2 group focus:outline-none py-2 min-h-[44px]"
                >
                  <ChevronDown
                    className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d2 ease-ez ${secoesExpandidas['fases'] ? 'rotate-180' : ''}`}
                  />
                  <h2 className="text-xl font-display font-bold text-ink-900">Fases & Subcategorias</h2>
                  {!secoesExpandidas['fases'] && (
                    <span className="text-xs text-ink-500 font-ui font-normal">
                      {fases.length === 0
                        ? `${subcategorias.length} ${subcategorias.length === 1 ? 'subcategoria' : 'subcategorias'}`
                        : `${fases.length} ${fases.length === 1 ? 'fase' : 'fases'} · ${subcategorias.length} ${subcategorias.length === 1 ? 'subcategoria' : 'subcategorias'}`}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <Button
                    variante="primario"
                    tamanho="sm"
                    onClick={fases.length === 0 ? handleDividirEmFases : handleAddFase}
                    disabled={salvandoFase || (fases.length > 0 && salvandoSub)}
                    className="min-h-[44px] sm:min-h-0"
                  >
                    {fases.length === 0 ? 'Dividir em fases' : '+ Nova fase'}
                  </Button>
                  {fases.length > 0 && (
                    <MenuAcoes
                      itens={[
                        {
                          label: 'Remover todas as fases',
                          perigo: true,
                          onClick: () => setConfirmandoRemoverDivisao(true)
                        }
                      ]}
                      rotulo="Opções das fases"
                      desabilitado={salvandoFase || salvandoSub}
                    />
                  )}
                </div>
              </div>
              {secoesExpandidas['fases'] && fases.length > 0 && (
                <div className="space-y-4">
                  {fases.map((fase) => {
                    const subsDaFase = subcategorias.filter(s => s.fase_id === fase.id)
                    const setSubIds = new Set(subsDaFase.map(s => s.id))
                    const regsDaFase = registros.filter(r => r.subcategoria_id && setSubIds.has(r.subcategoria_id))
                    const usadoFase = regsDaFase.reduce((acc, r) => acc + r.duracao, 0)
                    const reservadoFase = subsDaFase.reduce((acc, sub) => acc + (sub.horas_alocadas || 0), 0)
                    const isExpanded = fasesExpandidas[fase.id] ?? false
                    const isEditingThisFase = editandoFaseId === fase.id
                    const subsMapeadas = subsDaFase.map(sub => {
                      const duracao = regsDaFase.filter(r => r.subcategoria_id === sub.id).reduce((acc, r) => acc + r.duracao, 0)
                      return { id: sub.id, nome: sub.nome, duracao, horas_alocadas: sub.horas_alocadas ?? null }
                    })
                    const comDuracao = subsMapeadas.filter(s => s.duracao > 0).sort((a, b) => b.duracao - a.duracao)
                    const semDuracao = subsMapeadas.filter(s => s.duracao === 0).sort((a, b) => a.nome.localeCompare(b.nome))
                    const subcategoriasComPercentual: SubcategoriaBreakdownItem[] = [...comDuracao, ...semDuracao].map(s => ({ ...s, percentual: usadoFase > 0 ? Math.round((s.duracao / usadoFase) * 100) : 0 }))
                    const temPrevisto = fase.horas_contratadas !== null && fase.horas_contratadas !== undefined && fase.horas_contratadas > 0
                    const previstoFormatado = temPrevisto
                      ? (Number.isInteger(fase.horas_contratadas)
                          ? `${fase.horas_contratadas}h`
                          : `${fase.horas_contratadas!.toString().replace('.', ',')}h`)
                      : ''
                    return (
                      <Surface key={fase.id} elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                        {isEditingThisFase ? (
                          <div className="p-5 flex items-center justify-between gap-3 bg-surface-1 border-b border-hair">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                type="text"
                                value={nomeFaseEditando}
                                onChange={(e) => setNomeFaseEditando(e.target.value)}
                                placeholder="Nome da fase"
                                disabled={salvandoFase}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveEditFase(fase.id)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    handleCancelEditFase()
                                  }
                                }}
                                className={`${classeCampo()} !flex-1 !w-auto min-w-0 text-sm py-1.5 px-3`}
                                autoFocus
                              />
                              <input
                                type="text"
                                value={horasFaseEditando}
                                onChange={(e) => setHorasFaseEditando(e.target.value)}
                                placeholder="Horas"
                                disabled={salvandoFase}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveEditFase(fase.id)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    handleCancelEditFase()
                                  }
                                }}
                                className={`${classeCampo()} !w-24 text-sm py-1.5 px-3 font-mono`}
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSaveEditFase(fase.id)}
                                disabled={!nomeFaseEditando.trim() || salvandoFase}
                                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1.5 text-ok hover:text-ink-900 disabled:opacity-50 transition-colors flex items-center justify-center"
                                title="Confirmar"
                              >
                                <Check className="w-icon-md h-icon-md" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditFase}
                                disabled={salvandoFase}
                                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1.5 text-ink-500 hover:text-ink-900 transition-colors flex items-center justify-center"
                                title="Cancelar"
                              >
                                <X className="w-icon-md h-icon-md" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between p-5 hover:bg-surface-2 transition-colors duration-d1 ease-ez">
                            <button
                              type="button"
                              onClick={() => toggleFase(fase.id)}
                              disabled={editandoFaseId !== null}
                              className="flex-1 flex items-center justify-between min-w-0 pr-4 text-left focus:outline-none disabled:cursor-default"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <ChevronDown
                                  className={`w-icon-sm h-icon-sm text-ink-500 shrink-0 transition-transform duration-d2 ease-ez ${isExpanded ? 'rotate-180' : ''}`}
                                />
                                <span className="font-display font-bold text-ink-900 text-base whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis">{fase.nome}</span>
                              </div>
                              <div className="font-mono text-sm font-semibold text-ink-500 shrink-0 ml-2">
                                {temPrevisto ? (
                                  <>
                                    <span className="text-ink-900 font-bold">{usadoFase.toFixed(2).replace('.', ',')}h</span> de {previstoFormatado} previstas
                                  </>
                                ) : (
                                  <>
                                    <span className="text-ink-900 font-bold">{usadoFase.toFixed(2).replace('.', ',')}h</span> lançadas
                                  </>
                                )}
                              </div>
                            </button>
                            <div className="shrink-0 ml-1">
                              <MenuAcoes
                                itens={[
                                  {
                                    label: 'Adicionar subcategoria',
                                    onClick: () => {
                                      setAdicionandoEmFaseId(fase.id)
                                      setNovaSubNome('')
                                    }
                                  },
                                  {
                                    label: 'Editar fase',
                                    onClick: () => handleStartEditFase(fase)
                                  },
                                  {
                                    label: 'Excluir fase',
                                    onClick: () => handleClicarExcluirFase(fase),
                                    perigo: true,
                                    separadorAntes: true
                                  }
                                ]}
                                rotulo={`Ações da fase ${fase.nome}`}
                                desabilitado={salvandoFase || salvandoSub || editandoFaseId !== null}
                              />
                            </div>
                          </div>
                        )}
                        <div className={`overflow-hidden transition-all duration-d2 ${isExpanded ? 'max-h-[1000px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0'}`}>
                          {temPrevisto && (() => {
                            const teto = fase.horas_contratadas!
                            const usadoClamp = Math.min(usadoFase, teto)
                            const pctUsado = (usadoClamp / teto) * 100
                            const estourou = usadoFase > teto
                            const reservadoR = Math.round(reservadoFase * 100) / 100
                            const previstoR = Math.round(teto * 100) / 100

                            return (
                              <div className="mb-4 pt-1">
                                <div className="w-full bg-surface-0 h-[8px] rounded-full overflow-hidden border border-hair flex">
                                  {estourou ? (
                                    <div
                                      className="h-full transition-all duration-d4"
                                      style={{ width: '100%', backgroundColor: 'var(--bad)' }}
                                    />
                                  ) : (
                                    <div
                                      className="h-full transition-all duration-d4"
                                      style={{ width: `${pctUsado}%`, backgroundColor: 'var(--ok)' }}
                                    />
                                  )}
                                </div>
                                {reservadoR <= previstoR && (
                                  <p className="text-xs text-ink-500 mt-2 font-mono">
                                    {reservadoR === previstoR
                                      ? `Todas as ${formatarHoras(previstoR)}h previstas estão reservadas`
                                      : reservadoR > 0
                                      ? `${formatarHoras(reservadoR)}h reservadas em categorias · ${formatarHoras(previstoR - reservadoR)}h ainda sem reserva`
                                      : 'Nenhuma hora reservada em categorias'}
                                  </p>
                                )}
                              </div>
                            )
                          })()}

                          {renderListaSubcategorias(subcategoriasComPercentual)}

                          {adicionandoEmFaseId === fase.id && (
                            <div className="flex items-center gap-2 mt-3">
                              <input
                                type="text"
                                placeholder="Nova subcategoria..."
                                value={novaSubNome}
                                onChange={(e) => setNovaSubNome(e.target.value)}
                                disabled={salvandoSub}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleConfirmAddSubcategoria(fase.id)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    setAdicionandoEmFaseId(null)
                                    setNovaSubNome('')
                                  }
                                }}
                                className={`${classeCampo()} !flex-1 !w-auto min-w-0 text-xs py-1.5 px-3`}
                              />
                              <Button
                                variante="primario"
                                tamanho="sm"
                                onClick={() => handleConfirmAddSubcategoria(fase.id)}
                                disabled={!novaSubNome.trim() || salvandoSub}
                                className="min-h-[44px] sm:min-h-0"
                              >
                                Adicionar
                              </Button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdicionandoEmFaseId(null)
                                  setNovaSubNome('')
                                }}
                                disabled={salvandoSub}
                                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-ink-500 hover:text-ink-900 p-1 text-xs transition-colors flex items-center justify-center"
                                title="Cancelar"
                              >
                                <X className="w-icon-sm h-icon-sm" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 mt-3">
                            {adicionandoEmFaseId !== fase.id ? (
                              <Button
                                variante="secundario"
                                tamanho="sm"
                                onClick={() => {
                                  setAdicionandoEmFaseId(fase.id)
                                  setNovaSubNome('')
                                }}
                                disabled={salvandoSub}
                                className="min-h-[44px] sm:min-h-0"
                              >
                                + adicionar subcategoria
                              </Button>
                            ) : (
                              <div />
                            )}

                            {temPrevisto && (() => {
                              const diffFase = Math.round((fase.horas_contratadas! - reservadoFase) * 100) / 100
                              if (diffFase > 0) {
                                return (
                                  <p className="text-xs text-ink-500 shrink-0 font-ui">
                                    Restam {formatarHoras(diffFase)}h para reservar
                                  </p>
                                )
                              } else if (diffFase < 0) {
                                return (
                                  <div className="rounded-ctl px-3 py-1.5 text-xs border-l-[3px] border-l-bad bg-bad-bg text-bad flex items-center gap-2 shrink-0 font-ui">
                                    <AlertTriangle className="w-icon-xs h-icon-xs shrink-0 text-bad" />
                                    <span>{formatarHoras(Math.abs(diffFase))}h além das {formatarHoras(fase.horas_contratadas!)}h previstas</span>
                                  </div>
                                )
                              } else {
                                return (
                                  <div className="rounded-ctl px-3 py-1.5 text-xs border-l-[3px] border-l-ok bg-ok-bg text-ok flex items-center gap-2 shrink-0 font-ui">
                                    <Check className="w-icon-xs h-icon-xs shrink-0 text-ok" />
                                    <span>Totalmente reservado</span>
                                  </div>
                                )
                              }
                            })()}
                          </div>
                        </div>
                      </Surface>
                    )
                  })}

                  {/* Restauração do Bloco Sem Fase para registros e subcategorias órfãs */}
                  {(() => {
                    const idsSubsComFase = new Set(subcategorias.filter(s => s.fase_id).map(s => s.id))
                    const regsSemFase = registros.filter(r => !r.subcategoria_id || !idsSubsComFase.has(r.subcategoria_id))
                    const duracaoSemFase = regsSemFase.reduce((acc, r) => acc + r.duracao, 0)
                    const subsSemFase = subcategorias.filter(s => !s.fase_id)

                    if (duracaoSemFase === 0 && subsSemFase.length === 0) return null

                    const subIdsSemFaseSet = new Set(subsSemFase.map(s => s.id))
                    const semSubDuracaoFase = regsSemFase
                      .filter(r => !r.subcategoria_id || !subIdsSemFaseSet.has(r.subcategoria_id))
                      .reduce((acc, r) => acc + r.duracao, 0)

                    const subsMapeadas = subsSemFase.map(sub => {
                      const duracao = regsSemFase.filter(r => r.subcategoria_id === sub.id).reduce((acc, r) => acc + r.duracao, 0)
                      return { id: sub.id, nome: sub.nome, duracao, horas_alocadas: sub.horas_alocadas ?? null }
                    })
                    const comDuracao = subsMapeadas.filter(s => s.duracao > 0).sort((a, b) => b.duracao - a.duracao)
                    const semDuracao = subsMapeadas.filter(s => s.duracao === 0).sort((a, b) => a.nome.localeCompare(b.nome))
                    const subcategoriasComPercentual: SubcategoriaBreakdownItem[] = [...comDuracao, ...semDuracao].map(s => ({
                      ...s,
                      percentual: duracaoSemFase > 0 ? Math.round((s.duracao / duracaoSemFase) * 100) : 0
                    }))

                    if (semSubDuracaoFase > 0) {
                      subcategoriasComPercentual.push({
                        id: null,
                        nome: 'Sem subcategoria',
                        duracao: semSubDuracaoFase,
                        horas_alocadas: null,
                        percentual: duracaoSemFase > 0 ? Math.round((semSubDuracaoFase / duracaoSemFase) * 100) : 0
                      })
                    }

                    return (
                      <div className="border border-dashed border-hair-strong rounded-card p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-sm font-semibold text-ink-500 block font-ui">Sem fase</span>
                            <p className="text-xs text-ink-500 mt-0.5 font-ui">
                              Lançamentos que não pertencem a nenhuma fase. Some quando todos tiverem subcategoria.
                            </p>
                          </div>
                          <div className="font-mono text-sm font-semibold text-ink-500 shrink-0">
                            <span className="text-ink-900 font-bold">{duracaoSemFase.toFixed(2).replace('.', ',')}h</span> / —
                          </div>
                        </div>
                        {renderListaSubcategorias(subcategoriasComPercentual)}
                      </div>
                    )
                  })()}

                </div>
              )}

              {secoesExpandidas['fases'] && fases.length === 0 && (
                /* PROJETO SEM FASES */
                <Surface elevacao={1} comBorda padding="lg" className="space-y-3">
                  {(() => {
                    const subIdsCadastradas = new Set(subcategorias.map(s => s.id))
                    const duracaoSemSub = registros
                      .filter(r => !r.subcategoria_id || !subIdsCadastradas.has(r.subcategoria_id))
                      .reduce((acc, r) => acc + r.duracao, 0)

                    const subsMapeadas = subcategorias.map(sub => {
                      const duracao = registros
                        .filter(r => r.subcategoria_id === sub.id)
                        .reduce((acc, r) => acc + r.duracao, 0)
                      return {
                        id: sub.id,
                        nome: sub.nome,
                        duracao,
                        horas_alocadas: sub.horas_alocadas ?? null
                      }
                    })

                    const comDuracao = subsMapeadas
                      .filter(s => s.duracao > 0)
                      .sort((a, b) => b.duracao - a.duracao)

                    const semDuracao = subsMapeadas
                      .filter(s => s.duracao === 0)
                      .sort((a, b) => a.nome.localeCompare(b.nome))

                    const subcategoriasComPercentual: SubcategoriaBreakdownItem[] = [...comDuracao, ...semDuracao].map(s => ({
                      ...s,
                      percentual: totalLancado > 0
                        ? Math.round((s.duracao / totalLancado) * 100)
                        : 0
                    }))

                    if (duracaoSemSub > 0) {
                      subcategoriasComPercentual.push({
                        id: null,
                        nome: 'Sem subcategoria',
                        duracao: duracaoSemSub,
                        horas_alocadas: null,
                        percentual: totalLancado > 0 ? Math.round((duracaoSemSub / totalLancado) * 100) : 0
                      })
                    }

                    return renderListaSubcategorias(subcategoriasComPercentual)
                  })()}

                  {adicionandoSemFase && (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        placeholder="Nova subcategoria..."
                        value={novaSubNome}
                        onChange={(e) => setNovaSubNome(e.target.value)}
                        disabled={salvandoSub}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleConfirmAddSubcategoria(null)
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            setAdicionandoSemFase(false)
                            setNovaSubNome('')
                          }
                        }}
                        className={`${classeCampo()} !flex-1 !w-auto min-w-0 text-xs py-1.5 px-3`}
                      />
                      <Button
                        variante="primario"
                        tamanho="sm"
                        onClick={() => handleConfirmAddSubcategoria(null)}
                        disabled={!novaSubNome.trim() || salvandoSub}
                        className="min-h-[44px] sm:min-h-0"
                      >
                        Adicionar
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdicionandoSemFase(false)
                          setNovaSubNome('')
                        }}
                        disabled={salvandoSub}
                        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-ink-500 hover:text-ink-900 p-1 text-xs transition-colors flex items-center justify-center"
                        title="Cancelar"
                      >
                        <X className="w-icon-sm h-icon-sm" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-3">
                    {!adicionandoSemFase ? (
                      <Button
                        variante="secundario"
                        tamanho="sm"
                        onClick={() => {
                          setAdicionandoSemFase(true)
                          setNovaSubNome('')
                        }}
                        disabled={salvandoSub}
                        className="min-h-[44px] sm:min-h-0"
                      >
                        + adicionar subcategoria
                      </Button>
                    ) : (
                      <div />
                    )}

                    {projeto.horas_contratadas !== null && projeto.horas_contratadas > 0 && subcategorias.length > 0 && (() => {
                      const somaAlocada = subcategorias.reduce(
                        (acc, sub) => acc + (sub.horas_alocadas || 0), 0)

                      const diff = Math.round((projeto.horas_contratadas - somaAlocada) * 100) / 100
                      if (diff > 0) {
                        return (
                          <p className="text-xs text-ink-500 shrink-0 font-ui">
                            Restam {formatarHoras(diff)}h para reservar
                          </p>
                        )
                      } else if (diff < 0) {
                        return (
                          <div className="rounded-ctl px-3 py-1.5 text-xs border-l-[3px] border-l-bad bg-bad-bg text-bad flex items-center gap-2 shrink-0 font-ui">
                            <AlertTriangle className="w-icon-xs h-icon-xs shrink-0 text-bad" />
                            <span>{formatarHoras(Math.abs(diff))}h além das {formatarHoras(projeto.horas_contratadas)}h contratadas</span>
                          </div>
                        )
                      } else {
                        return (
                          <div className="rounded-ctl px-3 py-1.5 text-xs border-l-[3px] border-l-ok bg-ok-bg text-ok flex items-center gap-2 shrink-0 font-ui">
                            <Check className="w-icon-xs h-icon-xs shrink-0 text-ok" />
                            <span>Totalmente reservado</span>
                          </div>
                        )
                      }
                    })()}
                  </div>
                </Surface>
              )}
            </div>

            {/* Seção Plano Semanal */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSecao('plano')}
                    className="flex items-center gap-2 group focus:outline-none py-2 min-h-[44px]"
                  >
                    <ChevronDown
                      className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d2 ease-ez ${secoesExpandidas['plano'] ? 'rotate-180' : ''}`}
                    />
                    <h2 className="text-xl font-display font-bold text-ink-900">Plano semanal</h2>
                    {!secoesExpandidas['plano'] && (
                      <span className="text-xs text-ink-500 font-ui font-normal">
                        {planosSemanais.length === 1 ? '1 semana planejada' : `${planosSemanais.length} semanas planejadas`}
                      </span>
                    )}
                  </button>
                </div>
                {secoesExpandidas['plano'] && (
                  <p className="text-xs text-ink-500 mt-1 ml-6">Planeje a distribuição de horas do projeto por semana e acompanhe a comparação entre o planejado e o realizado.</p>
                )}
              </div>

              {secoesExpandidas['plano'] && (
                <Surface elevacao={1} comBorda padding="nenhum" className="p-5 space-y-5">
                  {planosSemanais.length === 0 && (
                    <p className="text-xs text-ink-500">
                      Nenhuma semana planejada para este projeto ainda. Preencha o formulário abaixo para adicionar a primeira semana.
                    </p>
                  )}

                  {/* Form de adicionar/editar semana */}
                  <form onSubmit={handleSalvarPlanoSemanal} className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1 min-w-[160px]">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Semana
                        </label>
                        <input
                          type="date"
                          value={semanaInputDate}
                          onChange={(e) => setSemanaInputDate(e.target.value)}
                          disabled={salvandoPlano}
                          className={`${classeCampo()} !font-mono`}
                        />
                      </div>

                      <div className="flex flex-col gap-1 w-36">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                          Horas planejadas
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={horasPlanejadasInput}
                          onChange={(e) => setHorasPlanejadasInput(e.target.value)}
                          placeholder="0"
                          disabled={salvandoPlano}
                          className={`${classeCampo()} !font-mono`}
                        />
                      </div>

                      <Button
                        variante="primario"
                        tamanho="md"
                        type="submit"
                        carregando={salvandoPlano}
                        disabled={salvandoPlano || !semanaInputDate || !horasPlanejadasInput.trim()}
                        className="min-h-[44px]"
                      >
                        {salvandoPlano ? 'Salvando...' : planoExistente ? 'Atualizar' : 'Adicionar'}
                      </Button>
                    </div>

                    {semanaInputDate && (() => {
                      const { inicio, fim } = intervaloDaSemana(semanaInicioCalculada, config.inicio_semana)
                      const intervaloTexto = formatarIntervaloCurto(inicio, fim)
                      return (
                        <div className="text-xs text-ink-500">
                          Semana de {intervaloTexto}
                          {planoExistente && (
                            <span> — já existe plano de {planoExistente.horas_planejadas.toString().replace('.', ',')}h, será atualizado</span>
                          )}
                        </div>
                      )
                    })()}
                  </form>

                  {/* Linha Informativa Comparação com Contratado */}
                  {temContratado && planosSemanais.length > 0 && (() => {
                    const excedeu = totalPlanejado > totalContratado!
                    const diff = Math.abs(totalContratado! - totalPlanejado)
                    return (
                      <div className={`text-xs font-medium ${excedeu ? 'text-bad' : 'text-ink-700'}`}>
                        Planejado: <span className="font-bold font-mono">{totalPlanejado.toFixed(2).replace('.', ',')}h</span> de{' '}
                        <span className="font-bold font-mono">{totalContratado!.toFixed(2).replace('.', ',')}h</span> contratadas —{' '}
                        {excedeu
                          ? `${diff.toFixed(2).replace('.', ',')}h acima do contratado`
                          : `faltam ${diff.toFixed(2).replace('.', ',')}h a planejar`
                        }
                      </div>
                    )
                  })()}

                  {/* Tabela de semanas planejadas */}
                  {planosComMetricas.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-hair text-ink-500 uppercase tracking-wider font-semibold">
                            <th className="py-2 px-3">Semana</th>
                            <th className="py-2 px-3 text-right">Planejado</th>
                            <th className="py-2 px-3 text-right">Realizado</th>
                            <th className="py-2 px-3 text-right">Diferença</th>
                            <th className="py-2 px-2 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hair">
                          {planosComMetricas.map((item) => {
                            const { inicio, fim } = intervaloDaSemana(item.semana_inicio, config.inicio_semana)
                            const d1 = String(inicio.getDate()).padStart(2, '0')
                            const m1 = String(inicio.getMonth() + 1).padStart(2, '0')
                            const d2 = String(fim.getDate()).padStart(2, '0')
                            const m2 = String(fim.getMonth() + 1).padStart(2, '0')
                            const periodoStr = `${d1}/${m1} a ${d2}/${m2}`

                            const corDiferenca = item.diferenca >= 0 ? 'var(--ok)' : 'var(--bad)'

                            return (
                              <tr
                                key={item.id}
                                onClick={() => handleSelecionarPlanoParaEdicao(item)}
                                className="hover:bg-surface-3 transition-colors duration-d1 ease-ez cursor-pointer group"
                              >
                                <td className="py-2.5 px-3 text-ink-900 font-medium">
                                  {periodoStr}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-ink-900">
                                  {item.horas_planejadas.toFixed(2).replace('.', ',')}h
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-ink-900">
                                  {item.realizado.toFixed(2).replace('.', ',')}h
                                </td>
                                <td
                                  className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold"
                                  style={{ color: corDiferenca }}
                                >
                                  {item.diferenca.toFixed(2).replace('.', ',')}h
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPlanoExcluindo(item)
                                    }}
                                    className="p-2.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-ink-500 hover:text-bad transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                    title="Excluir plano semanal"
                                  >
                                    <Trash2 className="w-icon-sm h-icon-sm" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-hair-strong font-bold">
                            <td className="py-3 px-3 text-ink-900">Total</td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-ink-900">
                              {totalPlanejado.toFixed(2).replace('.', ',')}h
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-ink-900">
                              {totalRealizadoPlanos.toFixed(2).replace('.', ',')}h
                            </td>
                            <td
                              className="py-3 px-3 text-right font-mono tabular-nums"
                              style={{ color: totalDiferencaPlanos >= 0 ? 'var(--ok)' : 'var(--bad)' }}
                            >
                              {totalDiferencaPlanos.toFixed(2).replace('.', ',')}h
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </Surface>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSecao('lancamentos')}
                    className="flex items-center gap-2 group focus:outline-none py-2 min-h-[44px]"
                  >
                    <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d2 ease-ez ${secoesExpandidas['lancamentos'] ? 'rotate-180' : ''}`} />
                    <h2 className="text-xl font-display font-bold text-ink-900">Lançamentos</h2>
                    {!secoesExpandidas['lancamentos'] && (
                      <span className="text-xs text-ink-500 font-ui font-normal">
                        {registros.length === 1 ? '1 lançamento' : `${registros.length} lançamentos`}
                      </span>
                    )}
                  </button>
                </div>
                {secoesExpandidas['lancamentos'] && (
                  <p className="text-xs text-ink-500 mt-1 ml-6">Clique para editar · use o olho para ver o dia completo em Registros</p>
                )}
              </div>

              {secoesExpandidas['lancamentos'] && (
                <>
                  {registrosPorSemana.length === 0 ? (
                    <Surface elevacao={1} comBorda padding="nenhum" className="p-8 text-center">
                      <p className="text-sm text-ink-500">Nenhum lançamento neste projeto.</p>
                    </Surface>
                  ) : (
                    <div className="space-y-4">
                      {registrosPorSemana.map((grupo) => {
                        const isExpanded = semanasExpandidas[grupo.semanaInicio] ?? false
                        return (
                          <Surface key={grupo.semanaInicio} elevacao={1} comBorda padding="nenhum" className="overflow-hidden">
                            <button type="button" onClick={() => toggleSemana(grupo.semanaInicio)} className="w-full flex items-center justify-between p-5 hover:bg-surface-3 transition-colors duration-d1 ease-ez focus:outline-none">
                              <div className="flex items-center gap-3 min-w-0">
                                <ChevronDown className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d3 ease-ez ${isExpanded ? 'rotate-180' : ''}`} />
                                <span className="font-bold text-ink-900 text-base truncate">{formatarSemanaLabel(grupo.semanaInicio)}</span>
                              </div>
                              <div className="font-mono text-sm font-semibold text-ink-900">{grupo.totalHoras.toFixed(2).replace('.', ',')}h</div>
                            </button>
                            <div className={`overflow-hidden transition-all duration-d3 ease-ez ${isExpanded ? 'max-h-[3000px] opacity-100 p-5 pt-0 border-t border-hair' : 'max-h-0 opacity-0'}`}>
                              <div className="flex flex-col gap-2 pt-3">
                                {grupo.registros.map((reg) => {
                                  const nomeSub = reg.subcategoria?.nome || subcategorias.find(s => s.id === reg.subcategoria_id)?.nome
                                  return (
                                    <div key={reg.id} onClick={() => abrirEditarRegistro(reg)} className="p-4 rounded-card bg-surface-0 hover:bg-surface-2 border border-hair transition-colors duration-d1 ease-ez cursor-pointer flex flex-col gap-2 group">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                                          <span className="font-mono text-xs text-ink-500 shrink-0">{formatarDataCurta(reg.data)}</span>
                                          <span className="text-xs text-ink-700 font-mono shrink-0">{reg.hora_inicio.slice(0, 5)}–{reg.hora_fim.slice(0, 5)}</span>
                                          {nomeSub && <span className="text-[10px] px-1.5 py-0.5 rounded-chip bg-surface-3 border border-hair-strong text-ink-500 font-medium whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis max-w-[150px] sm:max-w-[200px]">{nomeSub}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className="font-mono text-sm font-bold text-accent">
                                            {reg.duracao.toFixed(2).replace('.', ',')}h
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const targetUrl = reg.projeto_id
                                                ? `/registros?data=${reg.data}&projeto_id=${reg.projeto_id}`
                                                : `/registros?data=${reg.data}`
                                              navigate(targetUrl)
                                            }}
                                            className="p-2.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-ink-500 hover:text-accent transition-colors focus:outline-none"
                                            title="Ver no dia"
                                          >
                                            <Eye className="w-icon-sm h-icon-sm" />
                                          </button>
                                          <Pencil className="w-icon-sm h-icon-sm text-ink-500 hover:text-accent transition-colors" />
                                        </div>
                                      </div>
                                      {reg.observacao && <p className="text-xs text-ink-500 break-words leading-relaxed">{reg.observacao}</p>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </Surface>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <ModalRegistro
              isOpen={isModalRegistroOpen}
              onClose={fecharModalRegistro}
              onSave={handleSalvarRegistro}
              registro={editingRegistro}
              registrosExistentes={todosRegistros}
            />

            <ModalConfirmacao
              isOpen={subExcluindoId !== null}
              titulo="Excluir Subcategoria"
              mensagem="Excluir subcategoria? Os lançamentos vinculados são mantidos e passam a aparecer como 'Sem subcategoria'."
              perigo={true}
              textoConfirmar="Excluir"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarExclusaoSub}
              onCancelar={() => setSubExcluindoId(null)}
            />

            <ModalConfirmacao
              isOpen={faseExcluindoId !== null}
              titulo="Excluir Fase"
              mensagem="Excluir esta fase? Ela não tem subcategorias vinculadas."
              perigo={true}
              textoConfirmar="Excluir"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarExclusaoFase}
              onCancelar={() => setFaseExcluindoId(null)}
            />

            <ModalConfirmacao
              isOpen={confirmandoRemoverDivisao}
              titulo="Remover todas as fases"
              mensagem="Todas as fases deste projeto serão excluídas e ele volta ao modo simples. As subcategorias, os lançamentos e as horas contratadas são mantidos. Para remover apenas uma fase, use o ✕ da própria fase."
              perigo={true}
              textoConfirmar="Remover"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarRemoverDivisao}
              onCancelar={() => setConfirmandoRemoverDivisao(false)}
            />

            <ModalConfirmacao
              isOpen={planoExcluindo !== null}
              titulo="Excluir Plano Semanal"
              mensagem="Excluir este plano semanal? As horas lançadas no projeto continuam inalteradas."
              perigo={true}
              textoConfirmar="Excluir"
              textoCancelar="Cancelar"
              onConfirmar={handleConfirmarExclusaoPlano}
              onCancelar={() => setPlanoExcluindo(null)}
            />

            {faseComSubsExcluindo && (() => {
              const faseAlvo = fases.find(f => f.id === faseComSubsExcluindo.faseId)
              if (!faseAlvo) return null

              const subsDaFase = subcategorias.filter(s => s.fase_id === faseAlvo.id)
              const outrasFases = fases
                .filter(f => f.id !== faseAlvo.id)
                .sort((a, b) => a.ordem - b.ordem)

              return (
                <div
                  className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => { if (!salvandoFase) setFaseComSubsExcluindo(null) }}
                >
                  <Surface
                    elevacao={2}
                    comBorda
                    comSombra={false}
                    padding="nenhum"
                    className="w-[95%] sm:w-full max-w-sm p-6 relative shadow-e3 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setFaseComSubsExcluindo(null)}
                      disabled={salvandoFase}
                      type="button"
                      className="absolute top-4 right-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors z-10 disabled:opacity-50"
                    >
                      <X className="w-icon-lg h-icon-lg" />
                    </button>

                    <h3 className="text-xl font-display font-bold text-ink-900 mb-2 shrink-0">
                      Excluir fase
                    </h3>

                    <p className="text-sm text-ink-700 mb-4">
                      Esta fase tem {subsDaFase.length} subcategoria(s). Escolha o que fazer com elas — nenhum lançamento será perdido.
                    </p>

                    <div className="mb-6 space-y-1.5">
                      <label className="text-xs text-ink-500 font-medium">Destino das subcategorias</label>
                      <select
                        value={faseComSubsExcluindo.destinoFaseId}
                        onChange={(e) => setFaseComSubsExcluindo(prev => prev ? { ...prev, destinoFaseId: e.target.value } : null)}
                        disabled={salvandoFase}
                        className={`${classeCampo()} disabled:opacity-50 min-h-[44px]`}
                      >
                        {faseComSubsExcluindo.destinoFaseId === DESTINO_PENDENTE && (
                          <option value={DESTINO_PENDENTE} disabled>Escolha o destino</option>
                        )}
                        {outrasFases.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.nome}
                          </option>
                        ))}
                        <option value="">Deixar sem fase</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        variante="secundario"
                        tamanho="md"
                        type="button"
                        onClick={() => setFaseComSubsExcluindo(null)}
                        disabled={salvandoFase}
                        className="w-full sm:flex-1 sm:w-auto min-h-[44px]"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variante="destrutivo"
                        tamanho="md"
                        type="button"
                        onClick={() => handleConfirmarExclusaoFaseComSubs(faseAlvo.id, faseComSubsExcluindo.destinoFaseId)}
                        disabled={salvandoFase || faseComSubsExcluindo.destinoFaseId === DESTINO_PENDENTE}
                        className="w-full sm:flex-1 sm:w-auto min-h-[44px]"
                      >
                        {salvandoFase ? 'Excluindo...' : 'Excluir fase'}
                      </Button>
                    </div>
                  </Surface>
                </div>
              )
            })()}
          </div>
        )}
      </main>
    </div>
  )
}
