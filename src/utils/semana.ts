export type InicioSemana = 'segunda' | 'domingo' | 'sabado'

// Nota: O cálculo sempre arredonda para trás (para o dia de início da semana corrente ou anterior que contém a data).

// Formata YYYY-MM-DD a partir de um Date (local, sem UTC)
export function formatYYYYMMDD(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Mesma coisa, mas recebendo/retornando Date
export function inicioDaSemanaDate(data: Date, inicio: InicioSemana = 'segunda'): Date {
  const targetDay = inicio === 'domingo' ? 0 : inicio === 'sabado' ? 6 : 1
  const diaSemana = data.getDay()
  const diff = (diaSemana - targetDay + 7) % 7
  const res = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  res.setDate(res.getDate() - diff)
  res.setHours(0, 0, 0, 0)
  return res
}

// Retorna a data de início da semana que contém `dataStr`, no formato YYYY-MM-DD.
// SEMPRE arredonda PARA TRÁS (nunca para a próxima semana).
export function inicioDaSemana(dataStr: string, inicio: InicioSemana = 'segunda'): string {
  const [y, m, d] = dataStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dataInicio = inicioDaSemanaDate(date, inicio)
  return formatYYYYMMDD(dataInicio)
}

// Retorna { inicio: Date, fim: Date } — fim = inicio + 6 dias
export function intervaloDaSemana(dataStr: string, inicio: InicioSemana = 'segunda'): { inicio: Date; fim: Date } {
  const [y, m, d] = dataStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const start = inicioDaSemanaDate(date, inicio)
  const fim = new Date(start)
  fim.setDate(start.getDate() + 6)
  return { inicio: start, fim }
}

// Retorna os 7 dias da semana, em ordem, começando pelo dia de inicio
export function diasDaSemana(dataInput: string | Date, inicio: InicioSemana = 'segunda'): Date[] {
  const start = typeof dataInput === 'string'
    ? intervaloDaSemana(dataInput, inicio).inicio
    : inicioDaSemanaDate(dataInput, inicio)
  
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}
