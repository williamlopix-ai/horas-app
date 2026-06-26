import { supabase } from '../lib/supabase'
import type { Lembrete } from '../types'

export async function listarLembretes(usuarioId: string): Promise<Lembrete[]> {
  const { data, error } = await supabase
    .from('lembretes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('data_alvo', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export async function criarLembrete(input: {
  usuario_id: string
  titulo: string
  descricao: string | null
  data_alvo: string
  projeto_id: string | null
}): Promise<Lembrete> {
  const { data, error } = await supabase
    .from('lembretes')
    .insert([input])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function atualizarLembrete(
  id: string,
  campos: Partial<{
    titulo: string
    descricao: string | null
    data_alvo: string
    projeto_id: string | null
    status: 'pendente' | 'concluido' | 'descartado'
  }>
): Promise<Lembrete> {
  const { data, error } = await supabase
    .from('lembretes')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function excluirLembrete(id: string): Promise<void> {
  const { error } = await supabase
    .from('lembretes')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
