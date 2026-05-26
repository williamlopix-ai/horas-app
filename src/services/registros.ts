import { supabase } from '../lib/supabase'
import type { Registro } from '../types'

// Função auxiliar para calcular a duração centesimal
export function calcularDuracaoCentesimal(horaInicio: string, horaFim: string): number {
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFim.split(':').map(Number)
  
  const totalMinutosInicio = h1 * 60 + m1
  const totalMinutosFim = h2 * 60 + m2
  
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio
  
  if (diferencaMinutos <= 0) return 0
  
  const horasInteiras = Math.floor(diferencaMinutos / 60)
  const minutosRestantes = diferencaMinutos % 60
  
  // Regra crítica: horas_inteiras + (minutosRestantes / 60)
  const duracao = horasInteiras + (minutosRestantes / 60)
  
  return Math.round(duracao * 100) / 100
}

// Função auxiliar para calcular a segunda-feira da semana de início sem bugs de fuso horário
export function calcularSemanaInicio(dataStr: string): string {
  const [year, month, day] = dataStr.split('-').map(Number)
  const data = new Date(year, month - 1, day)
  const diaSemana = data.getDay() // 0=dom, 1=seg...6=sab
  const diasAtéSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  const segunda = new Date(data)
  segunda.setDate(data.getDate() - diasAtéSegunda)
  
  const yyyy = segunda.getFullYear()
  const mm = String(segunda.getMonth() + 1).padStart(2, '0')
  const dd = String(segunda.getDate()).padStart(2, '0')
  
  return `${yyyy}-${mm}-${dd}`
}

export async function listarRegistros(
  usuarioId: string,
  filtros?: { projetoId?: string; dataInicio?: string; dataFim?: string }
): Promise<(Registro & { projeto: { nome: string; cor: string; tipo: 'projeto' | 'rotina' } | null })[]> {
  let query = supabase
    .from('registros')
    .select(`
      *,
      projeto:projetos(nome, cor, tipo),
      subcategoria:subcategorias(nome)
    `)
    .eq('usuario_id', usuarioId)
    .order('data', { ascending: false })
    .order('hora_inicio', { ascending: false })

  if (filtros?.projetoId) {
    query = query.eq('projeto_id', filtros.projetoId)
  }
  if (filtros?.dataInicio) {
    query = query.gte('data', filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    query = query.lte('data', filtros.dataFim)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

export async function criarRegistro(
  dados: Omit<Registro, 'id' | 'duracao' | 'semana_inicio' | 'criado_em'>
): Promise<Registro> {
  const duracao = calcularDuracaoCentesimal(dados.hora_inicio, dados.hora_fim)
  const semana_inicio = calcularSemanaInicio(dados.data)

  const { data, error } = await supabase
    .from('registros')
    .insert([
      {
        ...dados,
        duracao,
        semana_inicio
      }
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function atualizarRegistro(
  id: string,
  dados: Partial<Omit<Registro, 'id' | 'usuario_id' | 'criado_em'>>
): Promise<Registro> {
  const atualizacao: any = { ...dados }

  // Recalcular duração e semana se os campos correspondentes forem atualizados
  if (dados.hora_inicio && dados.hora_fim) {
    atualizacao.duracao = calcularDuracaoCentesimal(dados.hora_inicio, dados.hora_fim)
  } else if (dados.hora_inicio || dados.hora_fim) {
    // Se apenas um foi enviado, precisaremos obter o outro do banco de dados ou do estado,
    // mas na nossa tela, sempre enviaremos hora_inicio e hora_fim juntos ao atualizar.
    // Para fins de segurança, calculamos se ambos estiverem disponíveis.
  }

  if (dados.data) {
    atualizacao.semana_inicio = calcularSemanaInicio(dados.data)
  }

  const { data, error } = await supabase
    .from('registros')
    .update(atualizacao)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function excluirRegistro(id: string): Promise<void> {
  const { error } = await supabase
    .from('registros')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
