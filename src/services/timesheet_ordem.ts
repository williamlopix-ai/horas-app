import { supabase } from '../lib/supabase'

export async function buscarOrdemManual(
  usuarioId: string,
  semanaInicio: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('timesheet_ordem_manual')
    .select('projeto_id')
    .eq('usuario_id', usuarioId)
    .eq('semana_inicio', semanaInicio)
    .order('posicao', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).map(row => row.projeto_id)
}

export async function salvarOrdemManual(
  usuarioId: string,
  semanaInicio: string,
  projetoIds: string[]
): Promise<void> {
  const itens = projetoIds.map((projetoId, index) => ({
    usuario_id: usuarioId,
    semana_inicio: semanaInicio,
    projeto_id: projetoId,
    posicao: index,
    atualizado_em: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('timesheet_ordem_manual')
    .upsert(itens, { onConflict: 'usuario_id,semana_inicio,projeto_id' })

  if (error) {
    throw error
  }
}
