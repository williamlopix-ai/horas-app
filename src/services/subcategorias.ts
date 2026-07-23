import { supabase } from '../lib/supabase'
import type { Subcategoria } from '../types'

export const subcategoriasService = {
  async listarSubcategorias(projetoId: string): Promise<Subcategoria[]> {
    const { data, error } = await supabase
      .from('subcategorias')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('nome')
    
    if (error) throw error
    return data || []
  },

  async criarSubcategoria(usuarioId: string, projetoId: string, nome: string): Promise<Subcategoria> {
    const { data, error } = await supabase
      .from('subcategorias')
      .insert([{ usuario_id: usuarioId, projeto_id: projetoId, nome }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async atualizarSubcategoria(id: string, nome: string, horasAlocadas?: number | null): Promise<Subcategoria> {
    const payload: { nome: string; horas_alocadas?: number | null } = { nome }
    if (horasAlocadas !== undefined) {
      payload.horas_alocadas = horasAlocadas
    }

    const { data, error } = await supabase
      .from('subcategorias')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async excluirSubcategoria(id: string): Promise<void> {
    const { error } = await supabase
      .from('subcategorias')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async atribuirFaseEmLote(projetoId: string, faseId: string | null): Promise<void> {
    const { error } = await supabase
      .from('subcategorias')
      .update({ fase_id: faseId })
      .eq('projeto_id', projetoId)

    if (error) throw error
  }
}
