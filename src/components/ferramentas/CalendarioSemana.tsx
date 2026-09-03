import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Surface } from '../ui/Surface'
import { listarRegistros } from '../../services/registros'
import { diasDaSemana, intervaloDaSemana, inicioDaSemana, formatYYYYMMDD } from '../../utils/semana'
import ColunaDia from './ColunaDia'
import ModalDiaUnico from './ModalDiaUnico'
import { HORA_INICIO, HORA_FIM, HORAS_DA_GRADE, ALTURA_HORA, ALTURA_GRADE, calcularBuracos, type RegistroComProjeto } from './grade'

const ROTULOS_DIA = ['Sáb', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex']

// Colunas fixas: horas | sáb (faixa fina) | dom (faixa fina) | 5 dias úteis.
const GRID_TEMPLATE_COLUMNS = '52px 14px 14px repeat(5, 1fr)'

export default function CalendarioSemana() {
  const { user } = useAuth()
  const [dataAncora, setDataAncora] = useState(() => formatYYYYMMDD(new Date()))
  const [registros, setRegistros] = useState<RegistroComProjeto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [agora, setAgora] = useState(() => new Date())
  const [diaModalIndex, setDiaModalIndex] = useState<0 | 1 | null>(null)

  const { inicio, fim } = useMemo(() => intervaloDaSemana(dataAncora, 'sabado'), [dataAncora])
  const dias = useMemo(() => diasDaSemana(dataAncora, 'sabado'), [dataAncora])
  const diasStr = useMemo(() => dias.map(formatYYYYMMDD), [dias])

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelado = false
    setCarregando(true)
    listarRegistros(user.id, { dataInicio: formatYYYYMMDD(inicio), dataFim: formatYYYYMMDD(fim) })
      .then(dados => { if (!cancelado) setRegistros(dados) })
      .finally(() => { if (!cancelado) setCarregando(false) })
    return () => { cancelado = true }
  }, [user, inicio, fim])

  function semanaAnterior() {
    const [y, m, d] = dataAncora.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() - 7)
    setDataAncora(formatYYYYMMDD(dt))
  }

  function semanaProxima() {
    const [y, m, d] = dataAncora.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + 7)
    setDataAncora(formatYYYYMMDD(dt))
  }

  function irParaHoje() {
    setDataAncora(formatYYYYMMDD(new Date()))
  }

  const hojeStr = formatYYYYMMDD(new Date())
  const isSemanaAtual = inicioDaSemana(dataAncora, 'sabado') === inicioDaSemana(hojeStr, 'sabado')

  const registrosPorDia = useMemo(() => {
    const mapa = new Map<string, RegistroComProjeto[]>()
    diasStr.forEach(d => mapa.set(d, []))
    registros.forEach(r => {
      if (mapa.has(r.data)) mapa.get(r.data)!.push(r)
    })
    return mapa
  }, [registros, diasStr])

  const totalLancado = useMemo(() => registros.reduce((acc, r) => acc + r.duracao, 0), [registros])
  const totalBuracos = useMemo(
    () => diasStr.reduce((acc, d) => acc + calcularBuracos(registrosPorDia.get(d) || []).length, 0),
    [diasStr, registrosPorDia]
  )

  const formatarIntervaloCabecalho = () => {
    const diasAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const f = (d: Date) => `${diasAbrev[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    return `${f(inicio)} — ${f(fim)}`
  }

  // Linha do "agora": só existe coluna e posição se hoje estiver na semana exibida e dentro de 08h–20h.
  const agoraDecimal = agora.getHours() + agora.getMinutes() / 60
  const agoraVisivel = diasStr.includes(hojeStr) && agoraDecimal >= HORA_INICIO && agoraDecimal <= HORA_FIM
  const agoraColunaIndex = diasStr.indexOf(hojeStr)
  const agoraTop = (agoraDecimal - HORA_INICIO) * ALTURA_HORA

  return (
    <Surface elevacao={1} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink-900">{formatarIntervaloCabecalho()}</h2>
          <p className="text-xs text-ink-500">
            {totalLancado.toFixed(2).replace('.', ',')}h lançadas · {totalBuracos} {totalBuracos === 1 ? 'buraco detectado' : 'buracos detectados'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={semanaAnterior}
            className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-icon-sm h-icon-sm" />
          </button>
          <button
            type="button"
            onClick={semanaProxima}
            className="h-11 w-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 rounded-ctl flex items-center justify-center transition-colors duration-d1 ease-ez cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
            title="Próxima semana"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-icon-sm h-icon-sm" />
          </button>
          <button
            type="button"
            onClick={irParaHoje}
            disabled={isSemanaAtual}
            className="h-11 bg-surface-2 border border-hair-strong hover:border-accent text-ink-700 hover:text-ink-900 text-xs font-semibold px-3 rounded-ctl transition-colors duration-d1 ease-ez cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-hair-strong disabled:hover:text-ink-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
          >
            Hoje
          </button>
        </div>
      </div>

      {carregando ? (
        <p className="text-xs text-ink-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
              <div />
              {dias.map((dia, i) => {
                const ehFimDeSemana = i === 0 || i === 1
                const ehHoje = diasStr[i] === hojeStr
                return (
                  <div
                    key={diasStr[i]}
                    className={`text-center pb-2 ${ehFimDeSemana ? 'opacity-60' : ''}`}
                  >
                    {!ehFimDeSemana && (
                      <>
                        <div className={`text-xs font-semibold uppercase tracking-wide ${ehHoje ? 'text-accent' : 'text-ink-500'}`}>
                          {ROTULOS_DIA[i]}
                        </div>
                        <div className="flex items-center justify-center">
                          <div
                            className={`text-sm font-bold ${ehHoje ? 'w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center' : 'text-ink-900'}`}
                          >
                            {String(dia.getDate()).padStart(2, '0')}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
              <div className="relative" style={{ height: ALTURA_GRADE }}>
                {HORAS_DA_GRADE.map(h => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-500 tabular-nums"
                    style={{ top: (h - HORA_INICIO) * ALTURA_HORA }}
                  >
                    {String(h).padStart(2, '0')}h
                  </div>
                ))}
              </div>

              {dias.map((dia, i) => {
                const diaStr = diasStr[i]
                const ehFimDeSemana = i === 0 || i === 1

                if (ehFimDeSemana) {
                  return (
                    <button
                      key={diaStr}
                      type="button"
                      onClick={() => setDiaModalIndex(i as 0 | 1)}
                      className="relative border-l border-hair bg-surface-0 flex items-center justify-center hover:bg-surface-2 transition-colors duration-d1 ease-ez cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:ring-inset"
                      style={{ height: ALTURA_GRADE }}
                      title={`Abrir ${ROTULOS_DIA[i]} ${String(dia.getDate()).padStart(2, '0')}`}
                    >
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wide text-ink-500"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {ROTULOS_DIA[i]} {String(dia.getDate()).padStart(2, '0')}
                      </span>
                    </button>
                  )
                }

                return (
                  <ColunaDia
                    key={diaStr}
                    registros={registrosPorDia.get(diaStr) || []}
                    agoraTop={agoraVisivel && agoraColunaIndex === i ? agoraTop : undefined}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      <ModalDiaUnico
        isOpen={diaModalIndex !== null}
        onClose={() => setDiaModalIndex(null)}
        data={dias[diaModalIndex ?? 0]}
        registros={registrosPorDia.get(diasStr[diaModalIndex ?? 0]) || []}
        agoraTop={diaModalIndex !== null && agoraVisivel && agoraColunaIndex === diaModalIndex ? agoraTop : undefined}
      />
    </Surface>
  )
}
