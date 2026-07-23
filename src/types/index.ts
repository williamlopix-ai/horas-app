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
  billable: boolean | null
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
  saldo_inicio_semana?: string | null
}

export interface Subcategoria {
  id: string
  projeto_id: string
  usuario_id: string
  nome: string
  fase_id: string | null
  horas_alocadas: number | null
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

export interface HorarioSemana {
  id: string
  usuario_id: string
  dia_semana: number
  inicio_dia: string
  fim_dia: string
  created_at?: string
}

export interface HorarioDia {
  id: string
  usuario_id: string
  data: string
  inicio_dia: string
  fim_dia: string
}

export interface Lembrete {
  id: string
  usuario_id: string
  titulo: string
  descricao: string | null
  data_alvo: string
  projeto_id: string | null
  status: 'pendente' | 'concluido' | 'descartado'
  criado_em: string
}

export interface Fase {
  id: string
  projeto_id: string
  usuario_id: string
  nome: string
  ordem: number
  horas_contratadas: number | null
  criado_em: string
}
