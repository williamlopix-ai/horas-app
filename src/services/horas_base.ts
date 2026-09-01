import { supabase } from '../lib/supabase'
import { buscarConfiguracoes } from './configuracoes'

// Interfaces
export interface HorasBaseSemanal {
  id: string
  horas_base: number
  semana_inicio: string
  criado_em: string
}

export interface HorasBaseMensal {
  id: string
  horas_base: number
  mes_inicio: string
  criado_em: string
}

export interface VigenciaHorasBase {
  horas_base: number
  inicio: string
  criado_em: string
}

// Busca horas base vigentes para uma semana
// Lógica: semana_inicio <= semanaRef ORDER BY criado_em DESC LIMIT 1
// Fallback: buscar configuracoes.meta_semanal do usuário
// Se não encontrar nada: retornar 42.5
export async function buscarHorasBaseSemanal(usuarioId: string, semanaRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('horas_base_semanal')
      .select('horas_base')
      .eq('usuario_id', usuarioId)
      .lte('semana_inicio', semanaRef)
      .order('semana_inicio', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      return Number(data[0].horas_base)
    }

    // Fallback
    const config = await buscarConfiguracoes(usuarioId)
    return config.meta_semanal ?? 42.5
  } catch (error) {
    console.error('Erro em buscarHorasBaseSemanal:', error)
    try {
      const config = await buscarConfiguracoes(usuarioId)
      return config.meta_semanal ?? 42.5
    } catch (fallbackError) {
      console.error('Erro no fallback de buscarHorasBaseSemanal:', fallbackError)
      return 42.5
    }
  }
}

// Todas as vigências de horas_base_semanal do usuário, sem filtro de data.
// Usada para agregação em lote (evita 1 query por período).
export async function listarTodasHorasBaseSemanalDoUsuario(usuarioId: string): Promise<VigenciaHorasBase[]> {
  try {
    const { data, error } = await supabase
      .from('horas_base_semanal')
      .select('horas_base, semana_inicio, criado_em')
      .eq('usuario_id', usuarioId)

    if (error) throw error

    return (data || []).map(v => ({
      horas_base: Number(v.horas_base),
      inicio: v.semana_inicio,
      criado_em: v.criado_em
    }))
  } catch (error) {
    console.error('Erro em listarTodasHorasBaseSemanalDoUsuario:', error)
    return []
  }
}

// Busca horas base vigentes para um mês
// Lógica: mes_inicio <= mesRef ORDER BY criado_em DESC LIMIT 1
// Fallback: buscarHorasBaseSemanal(usuarioId, mesRef) * 4
export async function buscarHorasBaseMensal(usuarioId: string, mesRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('horas_base_mensal')
      .select('horas_base')
      .eq('usuario_id', usuarioId)
      .lte('mes_inicio', mesRef)
      .order('mes_inicio', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      return Number(data[0].horas_base)
    }

    // Fallback
    const semanal = await buscarHorasBaseSemanal(usuarioId, mesRef)
    return semanal * 4
  } catch (error) {
    console.error('Erro em buscarHorasBaseMensal:', error)
    try {
      const semanal = await buscarHorasBaseSemanal(usuarioId, mesRef)
      return semanal * 4
    } catch (fallbackError) {
      console.error('Erro no fallback de buscarHorasBaseMensal:', fallbackError)
      return 42.5 * 4
    }
  }
}

// Todas as vigências de horas_base_mensal do usuário, sem filtro de data.
// Usada para agregação em lote (evita 1 query por período).
export async function listarTodasHorasBaseMensalDoUsuario(usuarioId: string): Promise<VigenciaHorasBase[]> {
  try {
    const { data, error } = await supabase
      .from('horas_base_mensal')
      .select('horas_base, mes_inicio, criado_em')
      .eq('usuario_id', usuarioId)

    if (error) throw error

    return (data || []).map(v => ({
      horas_base: Number(v.horas_base),
      inicio: v.mes_inicio,
      criado_em: v.criado_em
    }))
  } catch (error) {
    console.error('Erro em listarTodasHorasBaseMensalDoUsuario:', error)
    return []
  }
}

// Salva nova horas base semanal — NÃO sobrescreve anterior
export async function salvarHorasBaseSemanal(horas: number, semanaInicio: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('horas_base_semanal')
      .insert([
        {
          usuario_id: user.id,
          horas_base: horas,
          semana_inicio: semanaInicio
        }
      ])

    if (error) throw error
  } catch (error) {
    console.error('Erro em salvarHorasBaseSemanal:', error)
    throw error
  }
}

// Salva nova horas base mensal — NÃO sobrescreve anterior
export async function salvarHorasBaseMensal(horas: number, mesInicio: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('horas_base_mensal')
      .insert([
        {
          usuario_id: user.id,
          horas_base: horas,
          mes_inicio: mesInicio
        }
      ])

    if (error) throw error
  } catch (error) {
    console.error('Erro em salvarHorasBaseMensal:', error)
    throw error
  }
}

// Histórico completo semanal ORDER BY criado_em DESC
export async function listarHistoricoHorasBaseSemanal(): Promise<HorasBaseSemanal[]> {
  try {
    const { data, error } = await supabase
      .from('horas_base_semanal')
      .select('id, horas_base, semana_inicio, criado_em')
      .order('criado_em', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erro em listarHistoricoHorasBaseSemanal:', error)
    return []
  }
}

// Histórico completo mensal ORDER BY criado_em DESC
export async function listarHistoricoHorasBaseMensal(): Promise<HorasBaseMensal[]> {
  try {
    const { data, error } = await supabase
      .from('horas_base_mensal')
      .select('id, horas_base, mes_inicio, criado_em')
      .order('criado_em', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erro em listarHistoricoHorasBaseMensal:', error)
    return []
  }
}

// Exclui todas as horas base semanais com semana_inicio estritamente maior que semanaInicio
export async function excluirHorasBaseSemanalAPartirDe(semanaInicio: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('horas_base_semanal')
      .delete()
      .eq('usuario_id', user.id)
      .gt('semana_inicio', semanaInicio)
      .select('id')

    if (error) throw error

    return data ? data.length : 0
  } catch (error) {
    console.error('Erro em excluirHorasBaseSemanalAPartirDe:', error)
    throw error
  }
}

