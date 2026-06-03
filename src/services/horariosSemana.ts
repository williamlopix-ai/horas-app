import { supabase } from '../lib/supabase'
import type { HorarioSemana } from '../types'

export async function listarHorariosSemana(usuarioId: string): Promise<HorarioSemana[]> {
  const { data, error } = await supabase
    .from('horarios_semana')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('dia_semana', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export async function salvarHorarioSemana(
  usuarioId: string,
  diaSemana: number,
  inicioDia: string,
  fimDia: string
): Promise<HorarioSemana> {
  const { data, error } = await supabase
    .from('horarios_semana')
    .upsert(
      {
        usuario_id: usuarioId,
        dia_semana: diaSemana,
        inicio_dia: inicioDia,
        fim_dia: fimDia
      },
      { onConflict: 'usuario_id,dia_semana' }
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function removerHorarioSemana(id: string): Promise<void> {
  const { error } = await supabase
    .from('horarios_semana')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
