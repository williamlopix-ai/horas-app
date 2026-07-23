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

  async criarSubcategoria(usuarioId: string, projetoId: string, nome: string, faseId?: string | null): Promise<Subcategoria> {
    const payload: { usuario_id: string; projeto_id: string; nome: string; fase_id?: string | null } = {
      usuario_id: usuarioId,
      projeto_id: projetoId,
      nome
    }
    if (faseId !== undefined) {
      payload.fase_id = faseId
    }

    const { data, error } = await supabase
      .from('subcategorias')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async atualizarSubcategoria(id: string, nome: string, horasAlocadas?: number | null, faseId?: string | null): Promise<Subcategoria> {
    const payload: { nome: string; horas_alocadas?: number | null; fase_id?: string | null } = { nome }
    if (horasAlocadas !== undefined) {
      payload.horas_alocadas = horasAlocadas
    }
    if (faseId !== undefined) {
      payload.fase_id = faseId
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
  },

  async listarTodasSubcategorias(usuarioId: string): Promise<Subcategoria[]> {
    const { data, error } = await supabase
      .from('subcategorias')
      .select('*')
      .eq('usuario_id', usuarioId)

    if (error) throw error
    return data || []
  }
}
