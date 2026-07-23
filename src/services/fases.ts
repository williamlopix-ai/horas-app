import { supabase } from '../lib/supabase'
import type { Fase } from '../types'

export const fasesService = {
  async listarFases(projetoId: string): Promise<Fase[]> {
    const { data, error } = await supabase
      .from('fases')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async criarFase(usuarioId: string, projetoId: string, nome: string, ordem: number, horasContratadas: number | null): Promise<Fase> {
    const { data, error } = await supabase
      .from('fases')
      .insert([{ 
        usuario_id: usuarioId, 
        projeto_id: projetoId, 
        nome, 
        ordem, 
        horas_contratadas: horasContratadas 
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async atualizarFase(id: string, dados: Partial<Pick<Fase, 'nome' | 'ordem' | 'horas_contratadas'>>): Promise<Fase> {
    const { data, error } = await supabase
      .from('fases')
      .update(dados)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async excluirFase(id: string): Promise<void> {
    const { error } = await supabase
      .from('fases')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
