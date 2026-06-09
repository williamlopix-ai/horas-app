import { supabase } from '../lib/supabase'

export interface BillablePorProjeto {
  projeto_id: string
  nome: string
  codigo_externo: string
  horas_por_dia: Record<string, number> // chave: 'YYYY-MM-DD'
}

export interface BillablePorProjetoMensal {
  projeto_id: string
  nome: string
  codigo_externo: string
  horas_por_semana: Record<string, number> // chave: semana_inicio 'YYYY-MM-DD'
}

export async function buscarHorasBillableSemanal(
  semanaInicio: string,
  semanaFim: string
): Promise<BillablePorProjeto[]> {
  try {
    const { data: projetos, error: erroProjetos } = await supabase
      .from('projetos')
      .select('id, nome, codigo_externo')
      .eq('billable', true)
      .eq('status', 'ativo')
      .not('codigo_externo', 'is', null)

    if (erroProjetos) throw erroProjetos
    if (!projetos || projetos.length === 0) return []

    const idsProjetos = projetos.map(p => p.id)

    const { data: registros, error: erroRegistros } = await supabase
      .from('registros')
      .select('projeto_id, data, duracao')
      .in('projeto_id', idsProjetos)
      .gte('data', semanaInicio)
      .lte('data', semanaFim)

    if (erroRegistros) throw erroRegistros

    const registrosList = registros || []

    return projetos.map(p => {
      const horas_por_dia: Record<string, number> = {}
      const registrosDoProjeto = registrosList.filter(r => r.projeto_id === p.id)

      for (const reg of registrosDoProjeto) {
        const dia = reg.data
        const duracao = reg.duracao || 0
        horas_por_dia[dia] = (horas_por_dia[dia] || 0) + duracao
      }

      // Garante que o total de horas de cada dia seja arredondado para centesimal
      for (const dia in horas_por_dia) {
        horas_por_dia[dia] = Math.round(horas_por_dia[dia] * 100) / 100
      }

      return {
        projeto_id: p.id,
        nome: p.nome,
        codigo_externo: p.codigo_externo || '',
        horas_por_dia
      }
    })
  } catch (error) {
    console.error('Erro em buscarHorasBillableSemanal:', error)
    return []
  }
}

export async function buscarHorasBillableMensal(
  mesInicio: string,
  mesFim: string
): Promise<BillablePorProjetoMensal[]> {
  try {
    const { data: projetos, error: erroProjetos } = await supabase
      .from('projetos')
      .select('id, nome, codigo_externo')
      .eq('billable', true)
      .eq('status', 'ativo')
      .not('codigo_externo', 'is', null)

    if (erroProjetos) throw erroProjetos
    if (!projetos || projetos.length === 0) return []

    const idsProjetos = projetos.map(p => p.id)

    const { data: registros, error: erroRegistros } = await supabase
      .from('registros')
      .select('projeto_id, semana_inicio, duracao')
      .in('projeto_id', idsProjetos)
      .gte('data', mesInicio)
      .lte('data', mesFim)

    if (erroRegistros) throw erroRegistros

    const registrosList = registros || []

    return projetos.map(p => {
      const horas_por_semana: Record<string, number> = {}
      const registrosDoProjeto = registrosList.filter(r => r.projeto_id === p.id)

      for (const reg of registrosDoProjeto) {
        const semana = reg.semana_inicio
        if (semana) {
          const duracao = reg.duracao || 0
          horas_por_semana[semana] = (horas_por_semana[semana] || 0) + duracao
        }
      }

      // Garante que o total de horas de cada semana seja arredondado para centesimal
      for (const semana in horas_por_semana) {
        horas_por_semana[semana] = Math.round(horas_por_semana[semana] * 100) / 100
      }

      return {
        projeto_id: p.id,
        nome: p.nome,
        codigo_externo: p.codigo_externo || '',
        horas_por_semana
      }
    })
  } catch (error) {
    console.error('Erro em buscarHorasBillableMensal:', error)
    return []
  }
}

export async function buscarTotalBillableSemanal(
  semanaInicio: string,
  semanaFim: string
): Promise<number> {
  try {
    const { data: projetos, error: erroProjetos } = await supabase
      .from('projetos')
      .select('id')
      .eq('billable', true)
      .eq('status', 'ativo')
      .not('codigo_externo', 'is', null)

    if (erroProjetos) throw erroProjetos
    if (!projetos || projetos.length === 0) return 0

    const idsProjetos = projetos.map(p => p.id)

    const { data: registros, error: erroRegistros } = await supabase
      .from('registros')
      .select('duracao')
      .in('projeto_id', idsProjetos)
      .gte('data', semanaInicio)
      .lte('data', semanaFim)

    if (erroRegistros) throw erroRegistros

    const total = (registros || []).reduce((acc, r) => acc + (r.duracao || 0), 0)
    return Math.round(total * 100) / 100
  } catch (error) {
    console.error('Erro em buscarTotalBillableSemanal:', error)
    return 0
  }
}

export async function buscarTotalBillableMensal(
  mesInicio: string,
  mesFim: string
): Promise<number> {
  try {
    const { data: projetos, error: erroProjetos } = await supabase
      .from('projetos')
      .select('id')
      .eq('billable', true)
      .eq('status', 'ativo')
      .not('codigo_externo', 'is', null)

    if (erroProjetos) throw erroProjetos
    if (!projetos || projetos.length === 0) return 0

    const idsProjetos = projetos.map(p => p.id)

    const { data: registros, error: erroRegistros } = await supabase
      .from('registros')
      .select('duracao')
      .in('projeto_id', idsProjetos)
      .gte('data', mesInicio)
      .lte('data', mesFim)

    if (erroRegistros) throw erroRegistros

    const total = (registros || []).reduce((acc, r) => acc + (r.duracao || 0), 0)
    return Math.round(total * 100) / 100
  } catch (error) {
    console.error('Erro em buscarTotalBillableMensal:', error)
    return 0
  }
}
