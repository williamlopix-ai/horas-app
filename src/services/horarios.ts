import { supabase } from '../lib/supabase'
import type { HorarioDia } from '../types'

export async function buscarHorarioDia(
  usuarioId: string,
  data: string
): Promise<HorarioDia | null> {
  const { data: horario, error } = await supabase
    .from('horarios_dia')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('data', data)
    .maybeSingle()

  if (error) {
    throw error
  }

  return horario
}

export async function salvarHorarioDia(
  usuarioId: string,
  data: string,
  inicioDia: string,
  fimDia: string
): Promise<HorarioDia> {
  const { data: horario, error } = await supabase
    .from('horarios_dia')
    .upsert(
      {
        usuario_id: usuarioId,
        data,
        inicio_dia: inicioDia,
        fim_dia: fimDia
      },
      { onConflict: 'usuario_id,data' }
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return horario
}

export async function listarHorariosDias(usuarioId: string): Promise<HorarioDia[]> {
  const { data, error } = await supabase
    .from('horarios_dia')
    .select('*')
    .eq('usuario_id', usuarioId)

  if (error) {
    throw error
  }

  return data || []
}
