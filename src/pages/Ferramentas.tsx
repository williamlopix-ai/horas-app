import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { classeCampo, Field, Surface } from '../components/ui'
import { calcularDuracaoCentesimal } from '../services/registros'
import CalendarioSemana from '../components/ferramentas/CalendarioSemana'

type TabId = 'calendario-semana' | 'calculadora'

const ABAS: { id: TabId; rotulo: string }[] = [
  { id: 'calendario-semana', rotulo: 'Calendário da Semana' },
  { id: 'calculadora', rotulo: 'Calculadora' },
]

export default function Ferramentas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const abaParam = searchParams.get('aba') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(
    abaParam && ABAS.some(a => a.id === abaParam) ? abaParam : 'calendario-semana'
  )
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const abaRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})

  function selecionarAba(id: TabId) {
    setActiveTab(id)
    setSearchParams(prev => {
      const proximos = new URLSearchParams(prev)
      proximos.set('aba', id)
      return proximos
    }, { replace: true })
  }

  useEffect(() => {
    const recalcularPilula = () => {
      const container = tabsContainerRef.current
      const botaoAtivo = abaRefs.current[activeTab]
      if (!container || !botaoAtivo) return
      const containerRect = container.getBoundingClientRect()
      const botaoRect = botaoAtivo.getBoundingClientRect()
      setPillStyle({ left: botaoRect.left - containerRect.left, width: botaoRect.width })
    }

    recalcularPilula()
    window.addEventListener('resize', recalcularPilula)
    return () => window.removeEventListener('resize', recalcularPilula)
  }, [activeTab])

  return (
    <div className="relative min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      <div
        className="absolute inset-x-0 top-0 h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)'
        }}
      />

      <Sidebar />

      <main className="relative z-10 flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Ferramentas</h1>
          <p className="text-sm text-ink-500">Calculadoras e utilitários de apoio ao dia a dia.</p>
        </div>

        <div
          ref={tabsContainerRef}
          className="relative inline-flex items-center gap-xs max-w-full overflow-x-auto bg-surface-1 border border-hair rounded-ctl p-1"
        >
          <div
            className="absolute top-1 bottom-1 rounded-ctl bg-surface-3 transition-[left,width] duration-d3 ease-ez"
            style={{ left: pillStyle.left, width: pillStyle.width }}
          />
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              ref={(el) => { abaRefs.current[aba.id] = el }}
              onClick={() => selecionarAba(aba.id)}
              className={`relative z-10 min-h-[44px] px-4 rounded-ctl text-sm font-semibold whitespace-nowrap transition-colors duration-d1 ease-ez ${
                activeTab === aba.id ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>

        {activeTab === 'calendario-semana' ? (
          <CalendarioSemana />
        ) : (
          <CalculadoraTab />
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aba Calculadora
// ---------------------------------------------------------------------------

type ModoCalc = 'intervalo' | 'conversao'
type SubModoIntervalo = 'duracao' | 'fim'

interface ItemHistorico {
  id: string
  modo: ModoCalc
  subModo?: SubModoIntervalo
  expressao: string
  resultado: string
}

const MODOS: { id: ModoCalc; rotulo: string }[] = [
  { id: 'intervalo', rotulo: 'Intervalo' },
  { id: 'conversao', rotulo: 'hh:mm ⇄ centesimal' },
]

const CAMPOS_INICIAIS: Record<string, string> = {
  intInicioH: '',
  intInicioM: '',
  intFimH: '',
  intFimM: '',
  intPausa: '',
  intDuracaoAlvo: '',
  convHHMMH: '',
  convHHMMM: '',
  convCentesimal: '',
}

// Sub-chaves de hora/minuto dos campos Início/Fim (Intervalo) e hh:mm (Conversão) — aceitam só
// dígitos, no máximo 2 caracteres, e o teclado numérico da calculadora escreve na que estiver focada.
const CAMPOS_HM = new Set(['intInicioH', 'intInicioM', 'intFimH', 'intFimM', 'convHHMMH', 'convHHMMM'])
const PARES_HM: Record<string, string> = {
  intInicioH: 'intInicioM',
  intFimH: 'intFimM',
  convHHMMH: 'convHHMMM',
}

const TECLADO: { rotulo: string; valor: string }[] = [
  { rotulo: '7', valor: '7' }, { rotulo: '8', valor: '8' }, { rotulo: '9', valor: '9' }, { rotulo: 'Apagar', valor: 'apagar' },
  { rotulo: '4', valor: '4' }, { rotulo: '5', valor: '5' }, { rotulo: '6', valor: '6' }, { rotulo: 'Limpar', valor: 'limpar' },
  { rotulo: '1', valor: '1' }, { rotulo: '2', valor: '2' }, { rotulo: '3', valor: '3' },
  { rotulo: '0', valor: '0' }, { rotulo: ',', valor: ',' }, { rotulo: 'Salvar', valor: 'salvar' },
]

// Estilo do input quando o campo está no lado "resultado" (não-pivô) da conversão hh:mm ⇄ centesimal —
// legível, mas visualmente apagado, sem parecer campo quebrado.
const classeCampoSomenteLeitura =
  'w-full font-ui text-[13.5px] px-ctl-aba-x py-ctl-aba-y rounded-ctl bg-surface-1 text-ink-500 border border-hair outline-none cursor-default select-none shadow-[inset_0_1px_3px_rgba(0,0,0,.2)]'

// Variante Neo-Tátil de classeCampo() (Field.tsx) — mesma classe base, só acrescenta sombra interna
// simulando campo "afundado". Local a este arquivo: não é um token do design system.
function classeCampoNeoTatil(temErro = false): string {
  return `${classeCampo(temErro)} shadow-[inset_0_2px_4px_rgba(0,0,0,.35)]`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function parseCentesimal(str: string): number {
  const n = parseFloat(str.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function formatarCentesimal(valor: number): string {
  return valor.toFixed(2).replace('.', ',')
}

// Combina hora + minuto (cada um possivelmente vazio ou parcial) numa string "HH:MM" segura
// para alimentar calcularDuracaoCentesimal / minutosParaHoraRelogio, sem produzir NaN.
function combinarHoraMinuto(h: string, m: string): string {
  return `${(h || '0').padStart(2, '0')}:${(m || '0').padStart(2, '0')}`
}

// Conversão hh:mm ⇄ centesimal trata "hh:mm" como duração (pode passar de 24h), não como hora de relógio.
function hhmmParaCentesimalDuracao(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return 0
  return Math.round((h + m / 60) * 100) / 100
}

function centesimalParaHHMMDuracao(valor: number): string {
  const totalMinutos = Math.round(valor * 60)
  return `${pad2(Math.floor(totalMinutos / 60))}:${pad2(totalMinutos % 60)}`
}

// "Calcular fim" produz hora de relógio, então aqui sim o resultado gira em 24h.
function minutosParaHoraRelogio(totalMinutos: number): string {
  const normalizado = ((totalMinutos % 1440) + 1440) % 1440
  return `${pad2(Math.floor(normalizado / 60))}:${pad2(normalizado % 60)}`
}

function parseMinutos(str: string): number {
  const n = parseInt(str, 10)
  return isNaN(n) ? 0 : n
}

function aplicarTecla(atual: string, tecla: string): string {
  if (tecla === 'apagar') return atual.slice(0, -1)
  if (tecla === 'limpar') return ''
  return atual + tecla
}

function CalculadoraTab() {
  const [modo, setModo] = useState<ModoCalc>('intervalo')
  const [subModoIntervalo, setSubModoIntervalo] = useState<SubModoIntervalo>('duracao')
  const [pivoConversao, setPivoConversao] = useState<'hhmm' | 'centesimal'>('hhmm')
  const [campos, setCampos] = useState<Record<string, string>>(CAMPOS_INICIAIS)
  const [campoFocado, setCampoFocado] = useState<string | null>(null)
  const [historico, setHistorico] = useState<ItemHistorico[]>([])
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // No modo Conversão só o lado pivô é editável (estilo Google Tradutor); o outro é resultado
  // somente-leitura. Usado tanto para render (readOnly/estilo) quanto como trava defensiva no teclado.
  const camposBloqueadosConversao = modo === 'conversao'
    ? (pivoConversao === 'hhmm' ? new Set(['convCentesimal']) : new Set(['convHHMMH', 'convHHMMM']))
    : new Set<string>()

  function focarCampo(chave: string) {
    inputRefs.current[chave]?.focus()
  }

  function atualizarCampo(chave: string, valor: string) {
    setCampos(prev => {
      const atualizado = { ...prev, [chave]: valor }
      if (chave === 'convHHMMH' || chave === 'convHHMMM') {
        const combinado = combinarHoraMinuto(atualizado.convHHMMH, atualizado.convHHMMM)
        atualizado.convCentesimal = formatarCentesimal(hhmmParaCentesimalDuracao(combinado))
      } else if (chave === 'convCentesimal') {
        const [h, m] = centesimalParaHHMMDuracao(parseCentesimal(valor)).split(':')
        atualizado.convHHMMH = h
        atualizado.convHHMMM = m
      }
      return atualizado
    })
  }

  function atualizarCampoHM(chave: string, chaveDestino: string | null, valorBruto: string) {
    const filtrado = valorBruto.replace(/\D/g, '').slice(0, 2)
    atualizarCampo(chave, filtrado)
    if (filtrado.length === 2 && chaveDestino) {
      focarCampo(chaveDestino)
    }
  }

  function pressionarTecla(tecla: string) {
    if (tecla === 'salvar') {
      salvarNoHistorico()
      return
    }
    if (!campoFocado) return
    if (camposBloqueadosConversao.has(campoFocado)) return

    if (CAMPOS_HM.has(campoFocado)) {
      const valorAtual = campos[campoFocado] ?? ''
      const novoValor = aplicarTecla(valorAtual, tecla).replace(/\D/g, '').slice(0, 2)
      atualizarCampo(campoFocado, novoValor)
      if (novoValor.length === 2 && PARES_HM[campoFocado]) {
        focarCampo(PARES_HM[campoFocado])
      }
      return
    }

    const valorAtual = campos[campoFocado] ?? ''
    const novoValor = aplicarTecla(valorAtual, tecla)
    atualizarCampo(campoFocado, novoValor)
  }

  // Modo Intervalo — sub-modo Calcular duração: reaproveita calcularDuracaoCentesimal (fim <= início => 0),
  // a pausa entra depois de já convertido para centesimal. Só calcula se início e fim tiverem algo digitado,
  // senão mostra 0,00h em vez de NaN.
  const intInicioPreenchido = campos.intInicioH !== '' || campos.intInicioM !== ''
  const intFimPreenchido = campos.intFimH !== '' || campos.intFimM !== ''
  const intInicioCombinado = combinarHoraMinuto(campos.intInicioH, campos.intInicioM)
  const intFimCombinado = combinarHoraMinuto(campos.intFimH, campos.intFimM)

  const pausaIntervaloMin = parseMinutos(campos.intPausa)
  const duracaoBruta = intInicioPreenchido && intFimPreenchido
    ? calcularDuracaoCentesimal(intInicioCombinado, intFimCombinado)
    : 0
  const duracaoIntervalo = Math.max(0, Math.round((duracaoBruta - pausaIntervaloMin / 60) * 100) / 100)

  // Modo Intervalo — sub-modo Calcular fim: inverso, tudo em minutos até converter no final.
  const inicioValido = intInicioPreenchido
  const [horaInicioH, horaInicioM] = intInicioCombinado.split(':').map(Number)
  const minutosInicio = inicioValido ? horaInicioH * 60 + horaInicioM : 0
  const duracaoAlvoMin = Math.round(parseCentesimal(campos.intDuracaoAlvo) * 60)
  const fimCalculado = inicioValido
    ? minutosParaHoraRelogio(minutosInicio + duracaoAlvoMin + pausaIntervaloMin)
    : '--:--'

  // Modo Conversão: hh:mm agora vem de dois campos separados (H/M), combinados aqui.
  const convHHMMCombinado = combinarHoraMinuto(campos.convHHMMH, campos.convHHMMM)

  const displayPrincipal = modo === 'intervalo'
    ? (subModoIntervalo === 'duracao' ? `${formatarCentesimal(duracaoIntervalo)}h` : fimCalculado)
    : (pivoConversao === 'hhmm' ? `${campos.convCentesimal || '0,00'}h` : convHHMMCombinado)

  const legendaDisplay = modo === 'intervalo'
    ? (subModoIntervalo === 'fim' ? 'horário de relógio' : 'valor em centesimal')
    : (pivoConversao === 'hhmm' ? 'valor em centesimal' : 'valor em hh:mm')

  function salvarNoHistorico() {
    let expressao = ''
    let resultado = ''

    if (modo === 'intervalo') {
      if (subModoIntervalo === 'duracao') {
        expressao = `${intInicioPreenchido ? intInicioCombinado : '--:--'} → ${intFimPreenchido ? intFimCombinado : '--:--'} (pausa ${campos.intPausa || '0'}min)`
        resultado = `${formatarCentesimal(duracaoIntervalo)}h`
      } else {
        expressao = `${inicioValido ? intInicioCombinado : '--:--'} + ${campos.intDuracaoAlvo || '0'}h (pausa ${campos.intPausa || '0'}min)`
        resultado = fimCalculado
      }
    } else {
      expressao = `${convHHMMCombinado} ⇄ ${campos.convCentesimal || '0,00'}h`
      resultado = displayPrincipal
    }

    setHistorico(prev => [
      { id: crypto.randomUUID(), modo, subModo: modo === 'intervalo' ? subModoIntervalo : undefined, expressao, resultado },
      ...prev,
    ])
  }

  function abrirHistorico(item: ItemHistorico) {
    setModo(item.modo)
    if (item.modo === 'intervalo' && item.subModo) {
      setSubModoIntervalo(item.subModo)
    }
  }

  function renderParHorario(
    rotulo: string,
    chaveH: string,
    chaveM: string,
    placeholderH = '09',
    placeholderM = '00',
    somenteLeitura = false,
  ) {
    const classeInput = `${somenteLeitura ? classeCampoSomenteLeitura : classeCampoNeoTatil()} text-center`
    return (
      <Field rotulo={rotulo}>
        <div className="flex items-center gap-1.5">
          <div className="w-14">
            <input
              type="text"
              inputMode="numeric"
              placeholder={placeholderH}
              maxLength={2}
              value={campos[chaveH]}
              readOnly={somenteLeitura}
              ref={el => { inputRefs.current[chaveH] = el }}
              onFocus={somenteLeitura ? undefined : () => setCampoFocado(chaveH)}
              onChange={e => atualizarCampoHM(chaveH, chaveM, e.target.value)}
              className={classeInput}
            />
          </div>
          <span className="text-ink-500 font-semibold">:</span>
          <div className="w-14">
            <input
              type="text"
              inputMode="numeric"
              placeholder={placeholderM}
              maxLength={2}
              value={campos[chaveM]}
              readOnly={somenteLeitura}
              ref={el => { inputRefs.current[chaveM] = el }}
              onFocus={somenteLeitura ? undefined : () => setCampoFocado(chaveM)}
              onChange={e => atualizarCampoHM(chaveM, null, e.target.value)}
              className={classeInput}
            />
          </div>
        </div>
      </Field>
    )
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-xs bg-surface-1 border border-hair rounded-ctl p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,.3)]">
        {MODOS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModo(m.id)}
            className={`px-3 py-1.5 rounded-ctl text-xs font-semibold whitespace-nowrap transition-colors duration-d1 ease-ez ${
              modo === m.id
                ? 'bg-surface-3 text-ink-900 shadow-[0_1px_2px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.05)]'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {m.rotulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        <Surface elevacao={1} className="space-y-4">
          <div className="text-center py-4 rounded-ctl bg-surface-0 shadow-[inset_0_2px_6px_rgba(0,0,0,.4)]">
            <div
              className="text-4xl font-mono font-extrabold text-accent tabular-nums tracking-tight"
              style={{ textShadow: '0 0 12px color-mix(in srgb, var(--accent) 55%, transparent)' }}
            >
              {displayPrincipal}
            </div>
            <div className="text-xs text-ink-500 mt-1.5">{legendaDisplay}</div>
          </div>

          {modo === 'intervalo' && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-xs bg-surface-2 border border-hair rounded-ctl p-0.5">
                <button
                  type="button"
                  onClick={() => setSubModoIntervalo('duracao')}
                  className={`px-2.5 py-1 rounded-ctl text-[11.5px] font-semibold transition-colors duration-d1 ease-ez ${
                    subModoIntervalo === 'duracao' ? 'bg-surface-3 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  Calcular duração
                </button>
                <button
                  type="button"
                  onClick={() => setSubModoIntervalo('fim')}
                  className={`px-2.5 py-1 rounded-ctl text-[11.5px] font-semibold transition-colors duration-d1 ease-ez ${
                    subModoIntervalo === 'fim' ? 'bg-surface-3 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  Calcular fim
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderParHorario('Início', 'intInicioH', 'intInicioM')}

                {subModoIntervalo === 'duracao' ? (
                  renderParHorario('Fim', 'intFimH', 'intFimM')
                ) : (
                  <Field rotulo="Duração-alvo (centesimal)">
                    <input
                      type="text"
                      placeholder="3,50"
                      value={campos.intDuracaoAlvo}
                      onFocus={() => setCampoFocado('intDuracaoAlvo')}
                      onChange={e => atualizarCampo('intDuracaoAlvo', e.target.value)}
                      className={classeCampoNeoTatil()}
                    />
                  </Field>
                )}

                <Field rotulo="Pausa (min)">
                  <input
                    type="text"
                    placeholder="0"
                    value={campos.intPausa}
                    onFocus={() => setCampoFocado('intPausa')}
                    onChange={e => atualizarCampo('intPausa', e.target.value)}
                    className={classeCampoNeoTatil()}
                  />
                </Field>
              </div>
            </div>
          )}

          {modo === 'conversao' && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setPivoConversao(p => (p === 'hhmm' ? 'centesimal' : 'hhmm'))}
                  aria-label="Trocar campo editável entre hh:mm e centesimal"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ctl bg-surface-2 border border-hair-strong text-xs font-semibold text-ink-500 hover:text-ink-900 hover:bg-surface-3 transition-colors duration-d1 ease-ez shadow-[0_2px_4px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.06)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,.4)] active:translate-y-px"
                >
                  <ArrowLeftRight size={14} />
                  Trocar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderParHorario('hh:mm', 'convHHMMH', 'convHHMMM', '03', '30', pivoConversao === 'centesimal')}
                <Field rotulo="Centesimal">
                  <input
                    type="text"
                    placeholder="3,50"
                    value={campos.convCentesimal}
                    readOnly={pivoConversao === 'hhmm'}
                    onFocus={pivoConversao === 'hhmm' ? undefined : () => setCampoFocado('convCentesimal')}
                    onChange={e => atualizarCampo('convCentesimal', e.target.value)}
                    className={pivoConversao === 'hhmm' ? classeCampoSomenteLeitura : classeCampoNeoTatil()}
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 pt-2">
            {TECLADO.map(tecla => (
              <button
                key={tecla.valor}
                type="button"
                onClick={() => pressionarTecla(tecla.valor)}
                style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-3) 60%, var(--bg-2)), var(--bg-2))' }}
                className="min-h-[44px] rounded-ctl border border-hair-strong text-sm font-semibold text-ink-900 transition-colors duration-d1 ease-ez shadow-[0_2px_3px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.06)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,.45)] active:translate-y-px"
              >
                {tecla.rotulo}
              </button>
            ))}
          </div>
        </Surface>

        <Surface elevacao={1} className="space-y-2">
          <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Histórico</h2>
          {historico.length === 0 ? (
            <p className="text-xs text-ink-500">Nenhum cálculo salvo ainda.</p>
          ) : (
            <ul className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {historico.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => abrirHistorico(item)}
                    className="w-full text-left px-2.5 py-2 rounded-ctl bg-surface-2 hover:bg-surface-3 transition-colors duration-d1 ease-ez shadow-[inset_0_1px_2px_rgba(0,0,0,.15)]"
                  >
                    <div className="text-[11px] text-ink-500">{item.expressao}</div>
                    <div className="text-sm font-mono font-bold text-ink-900">{item.resultado}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  )
}
