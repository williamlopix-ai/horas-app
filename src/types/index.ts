export interface Projeto {
  id: string
  usuario_id: string
  nome: string
  cor: string
  status: 'ativo' | 'encerrado' | 'excluido'
  tipo: 'projeto' | 'rotina'
  horas_contratadas: number | null
  arquivado: boolean
  nome_original: string | null
  codigo_externo: string | null
  criado_em: string
}

export interface Configuracao {
  id: string
  usuario_id: string
  meta_semanal: number
  inicio_semana: 'segunda' | 'domingo'
  formato_horas: 'decimal' | 'hhmm'
  inicio_dia: string
  fim_dia: string
}

export interface Subcategoria {
  id: string
  projeto_id: string
  usuario_id: string
  nome: string
  criado_em: string
}

export interface Registro {
  id: string
  usuario_id: string
  projeto_id: string | null
  data: string
  hora_inicio: string
  hora_fim: string
  duracao: number
  observacao: string | null
  semana_inicio: string | null
  subcategoria_id: string | null
  subcategoria?: { nome: string } | null
  criado_em: string
}

export interface HorarioDia {
  id: string
  usuario_id: string
  data: string
  inicio_dia: string
  fim_dia: string
}
