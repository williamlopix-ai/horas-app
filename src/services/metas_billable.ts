import { supabase } from '../lib/supabase'

export interface MetaBillableSemanal {
  id: string
  meta: number
  semana_inicio: string
  criado_em: string
}

export interface MetaBillableMensal {
  id: string
  meta: number
  mes_inicio: string
  criado_em: string
}

export async function buscarMetaBillableSemanal(semanaRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('metas_billable_semanal')
      .select('meta')
      .lte('semana_inicio', semanaRef)
      .order('criado_em', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      return Number(data[0].meta)
    }

    return 40.00
  } catch (error) {
    console.error('Erro em buscarMetaBillableSemanal:', error)
    return 40.00
  }
}

export async function buscarMetaBillableMensal(mesRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('metas_billable_mensal')
      .select('meta')
      .lte('mes_inicio', mesRef)
      .order('mes_inicio', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      return Number(data[0].meta)
    }

    return 160.00
  } catch (error) {
    console.error('Erro em buscarMetaBillableMensal:', error)
    return 160.00
  }
}

export async function salvarMetaBillableSemanal(meta: number, semanaInicio: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('metas_billable_semanal')
      .insert([
        {
          usuario_id: user.id,
          meta,
          semana_inicio: semanaInicio
        }
      ])

    if (error) throw error
  } catch (error) {
    console.error('Erro em salvarMetaBillableSemanal:', error)
    throw error
  }
}

export async function salvarMetaBillableMensal(meta: number, mesInicio: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('metas_billable_mensal')
      .insert([
        {
          usuario_id: user.id,
          meta,
          mes_inicio: mesInicio
        }
      ])

    if (error) throw error
  } catch (error) {
    console.error('Erro em salvarMetaBillableMensal:', error)
    throw error
  }
}

export async function listarHistoricoMetasSemanal(): Promise<MetaBillableSemanal[]> {
  try {
    const { data, error } = await supabase
      .from('metas_billable_semanal')
      .select('id, meta, semana_inicio, criado_em')
      .order('criado_em', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erro em listarHistoricoMetasSemanal:', error)
    return []
  }
}

export async function listarHistoricoMetasMensal(): Promise<MetaBillableMensal[]> {
  try {
    const { data, error } = await supabase
      .from('metas_billable_mensal')
      .select('id, meta, mes_inicio, criado_em')
      .order('criado_em', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erro em listarHistoricoMetasMensal:', error)
    return []
  }
}

export interface MetaBillableMargem {
  id: string
  margem_minima: number
  semana_inicio: string
  criado_em: string
}

export async function buscarMargemMinimaVigente(semanaRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('metas_billable_margem')
      .select('margem_minima')
      .lte('semana_inicio', semanaRef)
      .order('criado_em', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      return Number(data[0].margem_minima)
    }

    return 92.00
  } catch (error) {
    console.error('Erro em buscarMargemMinimaVigente:', error)
    return 92.00
  }
}

export async function salvarMargemMinima(margem: number, semanaInicio: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('metas_billable_margem')
      .insert([
        {
          usuario_id: user.id,
          margem_minima: margem,
          semana_inicio: semanaInicio
        }
      ])

    if (error) throw error
  } catch (error) {
    console.error('Erro em salvarMargemMinima:', error)
    throw error
  }
}

export async function listarHistoricoMargem(): Promise<MetaBillableMargem[]> {
  try {
    const { data, error } = await supabase
      .from('metas_billable_margem')
      .select('id, margem_minima, semana_inicio, criado_em')
      .order('criado_em', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erro em listarHistoricoMargem:', error)
    return []
  }
}
