import { supabase } from '../lib/supabase'
import type { Configuracao } from '../types'

const CONFIG_PADRAO: Omit<Configuracao, 'id' | 'usuario_id'> = {
  meta_semanal: 42.5,
  inicio_semana: 'segunda',
  formato_horas: 'decimal',
  inicio_dia: '08:00',
  fim_dia: '18:00'
}

export async function buscarConfiguracoes(
  usuarioId: string
): Promise<Omit<Configuracao, 'id' | 'usuario_id'> & { id?: string; usuario_id?: string }> {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return {
      usuario_id: usuarioId,
      ...CONFIG_PADRAO
    }
  }

  return data
}

export async function salvarConfiguracoes(
  usuarioId: string,
  dados: Omit<Configuracao, 'id' | 'usuario_id'>
): Promise<Configuracao> {
  const { data, error } = await supabase
    .from('configuracoes')
    .upsert(
      {
        usuario_id: usuarioId,
        ...dados
      },
      { onConflict: 'usuario_id' }
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
