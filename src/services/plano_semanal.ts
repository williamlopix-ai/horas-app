import { supabase } from '../lib/supabase'
import type { PlanoSemanal } from '../types'

export async function listarPlanoSemanal(
  usuarioId: string,
  projetoId: string
): Promise<PlanoSemanal[]> {
  const { data, error } = await supabase
    .from('plano_semanal')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('projeto_id', projetoId)
    .order('semana_inicio', { ascending: true })

  if (error) {
    console.error('Erro ao listar plano semanal:', error)
    throw error
  }

  return data || []
}

export async function salvarPlanoSemana(dados: {
  usuarioId: string
  projetoId: string
  semanaInicio: string
  horasPlanejadas: number
}): Promise<PlanoSemanal> {
  const { data: existente, error: erroBusca } = await supabase
    .from('plano_semanal')
    .select('id')
    .eq('usuario_id', dados.usuarioId)
    .eq('projeto_id', dados.projetoId)
    .eq('semana_inicio', dados.semanaInicio)
    .is('fase_id', null)
    .maybeSingle()

  if (erroBusca) {
    console.error('Erro ao buscar plano semanal existente:', erroBusca)
    throw erroBusca
  }

  if (existente) {
    const { data, error } = await supabase
      .from('plano_semanal')
      .update({ horas_planejadas: dados.horasPlanejadas })
      .eq('id', existente.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar plano semanal:', error)
      throw error
    }
    return data
  }

  const { data, error } = await supabase
    .from('plano_semanal')
    .insert([{
      usuario_id: dados.usuarioId,
      projeto_id: dados.projetoId,
      fase_id: null,
      semana_inicio: dados.semanaInicio,
      horas_planejadas: dados.horasPlanejadas
    }])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar plano semanal:', error)
    throw error
  }
  return data
}

export async function excluirPlanoSemana(id: string): Promise<void> {
  const { error } = await supabase
    .from('plano_semanal')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir plano semanal:', error)
    throw error
  }
}

export const planoSemanalService = {
  listarPlanoSemanal,
  salvarPlanoSemana,
  excluirPlanoSemana
}
