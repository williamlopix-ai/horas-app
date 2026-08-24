import { supabase } from '../lib/supabase'
import type { Projeto } from '../types'

export async function listarProjetos(usuarioId: string, arquivado?: boolean): Promise<Projeto[]> {
  let query = supabase
    .from('projetos')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('ordem', { ascending: true, nullsFirst: false })
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
  const { data: projetosMesmoGrupo, error: fetchError } = await supabase
    .from('projetos')
    .select('ordem')
    .eq('usuario_id', dados.usuario_id)
    .eq('tipo', dados.tipo)

  if (fetchError) {
    throw fetchError
  }

  const maiorOrdem = (projetosMesmoGrupo || []).reduce((max, item) => {
    if (item.ordem !== null && item.ordem !== undefined && item.ordem > max) {
      return item.ordem
    }
    return max
  }, 0)

  const novaOrdem = maiorOrdem + 1

  const { data, error } = await supabase
    .from('projetos')
    .insert([
      {
        ...dados,
        codigo_externo: dados.codigo_externo,
        ordem: dados.ordem ?? novaOrdem
      }
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function atualizarOrdemProjetos(
  itens: { id: string; ordem: number }[]
): Promise<void> {
  const updates = itens.map(({ id, ordem }) =>
    supabase
      .from('projetos')
      .update({ ordem })
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  for (const result of results) {
    if (result.error) {
      throw result.error
    }
  }
}

export async function atualizarOrdemResumo(
  itens: { id: string; ordem_resumo: number }[]
): Promise<void> {
  const updates = itens.map(({ id, ordem_resumo }) =>
    supabase
      .from('projetos')
      .update({ ordem_resumo })
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  for (const result of results) {
    if (result.error) {
      throw result.error
    }
  }
}

export async function atualizarProjeto(
  id: string,
  dados: Partial<Omit<Projeto, 'id' | 'usuario_id' | 'criado_em'>>
): Promise<Projeto> {
  const { data, error } = await supabase
    .from('projetos')
    .update({
      ...dados,
      codigo_externo: dados.codigo_externo
    })
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
