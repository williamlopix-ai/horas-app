import { supabase } from '../lib/supabase'
import type { Projeto } from '../types'

export async function listarProjetos(usuarioId: string, arquivado?: boolean): Promise<Projeto[]> {
  let query = supabase
    .from('projetos')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('nome', { ascending: true })

  if (arquivado !== undefined) {
    query = query.eq('arquivado', arquivado)
  }

  const { data, error } = await query

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

export async function excluirProjeto(id: string): Promise<void> {
  const { error } = await supabase
    .from('projetos')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function arquivarProjeto(id: string): Promise<Projeto> {
  return atualizarProjeto(id, { arquivado: true })
}

export async function desarquivarProjeto(id: string): Promise<Projeto> {
  return atualizarProjeto(id, { arquivado: false })
}

export async function excluirProjetoComRegistros(id: string, nome: string): Promise<Projeto> {
  return atualizarProjeto(id, { 
    nome_original: nome, 
    status: 'excluido', 
    arquivado: false 
  })
}

export async function excluirPermanentemente(id: string): Promise<void> {
  const { error: errorRegistros } = await supabase
    .from('registros')
    .delete()
    .eq('projeto_id', id)

  if (errorRegistros) throw errorRegistros

  const { error: errorProjeto } = await supabase
    .from('projetos')
    .delete()
    .eq('id', id)

  if (errorProjeto) throw errorProjeto
}
