import {
  HORA_INICIO,
  HORAS_DA_GRADE,
  ALTURA_HORA,
  ALTURA_GRADE,
  horaParaDecimal,
  posicaoNaGrade,
  humanizarMinutos,
  formatarHora,
  calcularLanes,
  calcularBuracos,
  type RegistroComProjeto,
} from './grade'

interface ColunaDiaProps {
  registros: RegistroComProjeto[]
  // top (px) da linha do "agora" dentro da grade; undefined = não mostrar (dia fora da semana atual ou fora de 08h–20h)
  agoraTop?: number
}

export default function ColunaDia({ registros, agoraTop }: ColunaDiaProps) {
  const lanes = calcularLanes(registros)
  const buracos = calcularBuracos(registros)

  return (
    <div className="relative border-l border-hair" style={{ height: ALTURA_GRADE }}>
      {HORAS_DA_GRADE.map(h => (
        <div
          key={h}
          className="absolute inset-x-0 border-t border-hair"
          style={{ top: (h - HORA_INICIO) * ALTURA_HORA }}
        />
      ))}

      {agoraTop !== undefined && (
        <div
          className="absolute inset-x-0 h-[2px] z-20 pointer-events-none"
          style={{
            top: agoraTop,
            background: 'var(--fg-900)',
            boxShadow: '0 0 4px 1.5px color-mix(in srgb, var(--bg-0) 85%, transparent)',
          }}
        >
          <div
            className="absolute -left-[4.5px] -top-[3.5px] w-[9px] h-[9px] rounded-full"
            style={{
              background: 'var(--bad)',
              border: '2px solid var(--fg-900)',
              boxShadow: '0 0 4px 1px color-mix(in srgb, var(--bg-0) 70%, transparent)',
              position: 'relative',
            }}
          >
            <div
              className="absolute inset-[-2px] rounded-full pointer-events-none animate-radar-agora"
              style={{ border: '2px solid var(--bad)' }}
            />
          </div>
        </div>
      )}

      {buracos.map((buraco, idx) => {
        const pos = posicaoNaGrade(horaParaDecimal(buraco.inicio), horaParaDecimal(buraco.fim))
        if (!pos) return null
        return (
          <div
            key={`gap-${idx}`}
            className="absolute inset-x-1 rounded-ctl border border-dashed flex items-center justify-center"
            style={{
              top: pos.top,
              height: pos.height,
              borderColor: 'color-mix(in srgb, var(--bad) 45%, transparent)',
              background: 'color-mix(in srgb, var(--bad) 6%, transparent)',
            }}
          >
            <span className="text-[10.5px] font-semibold text-bad">{humanizarMinutos(buraco.minutos)}</span>
          </div>
        )
      })}

      {lanes.map(({ registro, lane, totalLanes }) => {
        const pos = posicaoNaGrade(horaParaDecimal(registro.hora_inicio), horaParaDecimal(registro.hora_fim))
        if (!pos) return null
        const cor = registro.projeto?.cor || 'var(--accent)'
        const largura = 100 / totalLanes
        const completo = pos.height >= 60
        return (
          <div
            key={registro.id}
            className={`absolute rounded-ctl overflow-hidden shadow-e1 ${completo ? 'px-2 py-1' : 'px-1.5 py-0.5 flex items-center'}`}
            style={{
              top: pos.top,
              height: Math.max(pos.height - 2, 0),
              left: `calc(${lane * largura}% + 2px)`,
              width: `calc(${largura}% - 4px)`,
              background: `linear-gradient(135deg, ${cor}, color-mix(in srgb, ${cor} 65%, black))`,
            }}
            title={`${registro.projeto?.nome || 'Sem projeto'} · ${formatarHora(registro.hora_inicio)}–${formatarHora(registro.hora_fim)}`}
          >
            {completo ? (
              <>
                <div className="text-[11px] font-bold text-white leading-tight truncate">
                  {registro.projeto?.nome || 'Sem projeto'}
                </div>
                <div className="text-[10.5px] text-white/85 leading-tight tabular-nums">
                  {formatarHora(registro.hora_inicio)}–{formatarHora(registro.hora_fim)}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-1 w-full min-w-0">
                <span className="text-[9.5px] font-bold text-white truncate min-w-0">
                  {registro.projeto?.nome || 'Sem projeto'}
                </span>
                <span className="text-[8.5px] font-mono text-white/85 shrink-0">
                  {formatarHora(registro.hora_inicio)}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
