import { supabase } from '../lib/supabase'
import type { Projeto } from '../types'

export async function listarProjetos(usuarioId: string): Promise<Projeto[]> {
  const { data, error } = await supabase
    .from('projetos')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('nome', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export async function criarProjeto(dados: Omit<Projeto, 'id' | 'criado_em'>): Promise<Projeto> {
  const { data, error } = await supabase
    .from('projetos')
    .insert([dados])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function atualizarProjeto(
  id: string,
  dados: Partial<Omit<Projeto, 'id' | 'usuario_id' | 'criado_em'>>
): Promise<Projeto> {
  const { data, error } = await supabase
    .from('projetos')
    .update(dados)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function encerrarProjeto(id: string): Promise<Projeto> {
  return atualizarProjeto(id, { status: 'encerrado' })
}

export async function reativarProjeto(id: string): Promise<Projeto> {
  return atualizarProjeto(id, { status: 'ativo' })
}
