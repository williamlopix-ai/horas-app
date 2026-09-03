import type { Registro } from '../../types'

export type RegistroComProjeto = Registro & {
  projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina'; status: 'ativo' | 'encerrado' | 'excluido'; nome_original: string | null } | null
}

export interface Buraco {
  inicio: string
  fim: string
  minutos: number
}

export const HORA_INICIO = 8
export const HORA_FIM = 20
export const ALTURA_HORA = 56
export const ALTURA_GRADE = (HORA_FIM - HORA_INICIO) * ALTURA_HORA
export const HORAS_DA_GRADE = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i)

export function horaParaDecimal(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return HORA_INICIO
  return h + m / 60
}

// Converte decimal de hora em { top, height } já recortados na faixa 08h–20h, para nunca vazar da grade.
export function posicaoNaGrade(inicioDecimal: number, fimDecimal: number): { top: number; height: number } | null {
  const inicioClampado = Math.max(inicioDecimal, HORA_INICIO)
  const fimClampado = Math.min(fimDecimal, HORA_FIM)
  if (fimClampado <= inicioClampado) return null
  return {
    top: (inicioClampado - HORA_INICIO) * ALTURA_HORA,
    height: (fimClampado - inicioClampado) * ALTURA_HORA,
  }
}

export function humanizarMinutos(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}min`
}

export function formatarHora(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`
}

// Particionamento guloso em "lanes": registros do mesmo dia cujo horário se cruza (dado legado
// inconsistente — o ModalRegistro já bloqueia isso na criação) dividem a largura da coluna em vez
// de se sobrepor ilegivelmente. Sem cruzamento, cada dia tem 1 lane só (bloco ocupa a coluna inteira).
export function calcularLanes(registrosDoDia: RegistroComProjeto[]): { registro: RegistroComProjeto; lane: number; totalLanes: number }[] {
  const ordenados = [...registrosDoDia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  const fimPorLane: string[] = []
  const comLane = ordenados.map(registro => {
    let lane = fimPorLane.findIndex(fim => fim <= registro.hora_inicio)
    if (lane === -1) {
      lane = fimPorLane.length
      fimPorLane.push(registro.hora_fim)
    } else {
      fimPorLane[lane] = registro.hora_fim
    }
    return { registro, lane }
  })
  const totalLanes = fimPorLane.length
  return comLane.map(({ registro, lane }) => ({ registro, lane, totalLanes }))
}

// Buracos só ENTRE lançamentos do mesmo dia (não no início/fim do dia), mínimo 5min.
// Pares que se sobrepõem (fim <= inicio falha) simplesmente não geram buraco.
export function calcularBuracos(registrosDoDia: RegistroComProjeto[]): Buraco[] {
  const ordenados = [...registrosDoDia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  const buracos: Buraco[] = []
  for (let i = 0; i < ordenados.length - 1; i++) {
    const fimAtual = ordenados[i].hora_fim
    const inicioProximo = ordenados[i + 1].hora_inicio
    if (fimAtual > inicioProximo) continue
    const minutos = Math.round((horaParaDecimal(inicioProximo) - horaParaDecimal(fimAtual)) * 60)
    if (minutos >= 5) {
      buracos.push({ inicio: fimAtual, fim: inicioProximo, minutos })
    }
  }
  return buracos
}
